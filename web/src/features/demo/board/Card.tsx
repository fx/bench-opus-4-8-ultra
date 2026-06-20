import type { KeyboardEvent, ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Sparkles } from "lucide-react";
import { cn } from "../../../lib/cn.ts";
import type { Issue } from "../data/types.ts";
import { IssueTypeIcon } from "./IssueTypeIcon.tsx";
import { PriorityIcon } from "./PriorityIcon.tsx";
import {
  AssigneeAvatar,
  EpicLozenge,
  LabelLozenge,
  StoryPoints,
} from "./CardMeta.tsx";

// A single Jira-style board card (see docs/specs/demo-jira-clone › Kanban
// Board). It renders the full issue meta — optional epic lozenge, summary,
// labels, then a footer row with issue-type icon, key, priority chevron, points
// badge and assignee avatar — and is draggable between columns via @dnd-kit's
// `useDraggable`.
//
// Forward-looking slots (kept minimal here; the features land later):
//  - onOpen: click/Enter/Space opens the issue detail view (wired in 0006).
//  - aiSlot: a render slot for the "✨ Implement now with AI" action (0007).
// Neither feature is implemented here — the card only exposes the hook points so
// the later changes plug in without restructuring the card.

export interface CardProps {
  issue: Issue;
  // Opens the issue detail (0006). Optional: until wired the card is a static,
  // draggable tile with no click behaviour.
  onOpen?: (key: string) => void;
  // Render slot for the AI action (0007). Rendered into the card's hover bar.
  aiSlot?: ReactNode;
}

export function Card({ issue, onOpen, aiSlot }: CardProps) {
  // useDraggable makes the card a drag source; the drop is handled by the
  // Board's DndContext onDragEnd. `id` is the issue key so the handler can map a
  // drop straight back to a store `moveIssue(key, status)` call.
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: issue.key });

  // While dragging, translate the card under the pointer and fade it (opacity is
  // applied via the dragging className below) so it reads as the moving item.
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const interactive = Boolean(onOpen);

  function handleOpen() {
    onOpen?.(issue.key);
  }

  // @dnd-kit binds keyboard handling for its accessible drag (Space to pick up /
  // drop, arrows to move) via listeners.onKeyDown. We must NOT replace it: Enter
  // opens the detail view, then we forward EVERY event to @dnd-kit's handler so
  // the keyboard drag sensor keeps working. Without this merge, setting our own
  // onKeyDown would clobber listeners.onKeyDown and break keyboard dragging.
  const dndKeyDown = listeners?.onKeyDown as
    | ((event: KeyboardEvent) => void)
    | undefined;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleOpen();
    }
    dndKeyDown?.(event);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // @dnd-kit's attributes (role=button, tabIndex, aria-roledescription for
      // the keyboard drag sensor) come first; the card's own handlers and data
      // hooks below intentionally augment — not replace — them. onKeyDown is
      // explicitly merged (handleKeyDown) rather than overridden.
      {...attributes}
      {...listeners}
      data-testid="board-card"
      data-issue-key={issue.key}
      data-dragging={isDragging || undefined}
      onClick={interactive ? handleOpen : undefined}
      onKeyDown={interactive ? handleKeyDown : dndKeyDown}
      className={cn(
        "group relative flex touch-none flex-col gap-2 rounded border border-border bg-card p-2.5 text-left shadow-sm",
        "transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        interactive && "cursor-pointer",
        isDragging && "opacity-60 shadow-lg ring-2 ring-primary",
      )}
    >
      {/* Epic context lozenge (optional). */}
      {issue.epic && (
        <div className="flex">
          <EpicLozenge epic={issue.epic} />
        </div>
      )}

      {/* Summary. */}
      <p className="text-sm font-medium leading-snug text-foreground">
        {issue.summary}
      </p>

      {/* Labels (optional). */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.labels.map((label) => (
            <LabelLozenge key={label} label={label} />
          ))}
        </div>
      )}

      {/* Footer meta row: type icon · key · priority — then points · assignee. */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <IssueTypeIcon type={issue.type} />
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            {issue.key}
          </span>
          <PriorityIcon priority={issue.priority} />
          {issue.handledByAgent && (
            // Parody "agent shipped this" marker (full glow lands in 0007).
            <span
              data-testid="agent-handled"
              title="Rovo handled this"
              className="inline-flex items-center gap-0.5 rounded-sm bg-[#6554C0]/10 px-1 text-[10px] font-semibold text-[#6554C0]"
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Rovo
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {issue.storyPoints !== null && (
            <StoryPoints points={issue.storyPoints} />
          )}
          <AssigneeAvatar user={issue.assignee} />
        </div>
      </div>

      {/* AI action slot (0007). Hidden until the card is hovered or anything in
          it receives focus. Uses `invisible` (visibility: hidden), NOT opacity:
          opacity-0 would keep a focusable child (the 0007 button) in the tab
          order while invisible, so keyboard users would tab to an unseen
          control. `invisible` removes the slot and its descendants from the tab
          order and from pointer hit-testing until revealed. It is absolutely
          positioned, so the empty/hidden state adds no height (no layout shift). */}
      {aiSlot && (
        <div
          data-testid="card-ai-slot"
          className="invisible absolute right-2 top-2 group-hover:visible group-focus-within:visible"
        >
          {aiSlot}
        </div>
      )}
    </div>
  );
}
