import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "../../../lib/cn.ts";
import { STATUS_LABELS, type Issue, type Status } from "../data/types.ts";
import { Card } from "./Card.tsx";

// A single board column (see docs/specs/demo-jira-clone › Kanban Board). It is a
// @dnd-kit droppable keyed by Status, so a card dropped onto it reports
// `over.id === status` to the Board's onDragEnd. The header shows the column
// name and a LIVE issue count (the length of the issues it is handed, which the
// Board derives from store selectors — so the count updates the instant a drop
// changes membership).

export interface ColumnProps {
  status: Status;
  issues: Issue[];
  // Forwarded to each Card (issue-detail open, 0006).
  onOpenIssue?: (key: string) => void;
  // Per-issue AI action slot (0007). The Board supplies a renderer; the Column
  // just threads it through to each Card.
  renderAiSlot?: (issue: Issue) => ReactNode;
}

export function Column({
  status,
  issues,
  onOpenIssue,
  renderAiSlot,
}: ColumnProps) {
  // Droppable target. `isOver` highlights the column while a card hovers it.
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const count = issues.length;

  return (
    <section
      aria-label={STATUS_LABELS[status]}
      data-status={status}
      className="flex w-72 shrink-0 flex-col rounded-md bg-page"
    >
      {/* Column header: name + live count. */}
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {STATUS_LABELS[status]}
        </h2>
        <span
          data-testid="column-count"
          aria-label={`${count} issues`}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-border px-1.5 text-xs font-semibold text-muted-foreground"
        >
          {count}
        </span>
      </header>

      {/* Droppable card list. min-h keeps an empty column a valid drop target;
          the ring highlights it while a card is dragged over. */}
      <div
        ref={setNodeRef}
        data-testid={`column-dropzone-${status}`}
        data-over={isOver || undefined}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-md p-2 transition-colors",
          isOver && "bg-accent ring-2 ring-inset ring-primary/40",
        )}
      >
        {issues.map((issue) => (
          <Card
            key={issue.key}
            issue={issue}
            onOpen={onOpenIssue}
            aiSlot={renderAiSlot?.(issue)}
          />
        ))}
        {count === 0 && (
          // Empty-state hint so a column never reads as "broken" when emptied.
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            No issues
          </p>
        )}
      </div>
    </section>
  );
}
