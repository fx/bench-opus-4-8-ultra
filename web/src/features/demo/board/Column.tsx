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
      // Fluid columns: each flexes to share the board width equally (flex-1 +
      // basis-0) with a 240px floor (min-w-60) and a 360px cap. At desktop widths
      // the four columns + gaps fit inside the board area (≈1008px at a 1280px
      // viewport, so 4×240 + 3×12 = 996px fits — like real Jira, no "Done" cut
      // off). When the board area is narrower than the four floors, min-w-60
      // stops the columns shrinking further and the board's overflow-x-auto track
      // scrolls instead of overflowing the document.
      className="flex min-w-60 max-w-[360px] flex-1 basis-0 flex-col rounded-md bg-page"
    >
      {/* Column header: name + live count. */}
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {STATUS_LABELS[status]}
        </h2>
        <span
          data-testid="column-count"
          aria-label={`${count} issues`}
          // Subtle grey count pill (bg-border #E1E5EA), like real Jira. Text is
          // text-foreground (#172B4D) not text-muted-foreground: muted (#607085)
          // on the darker #E1E5EA pill is only 4.0:1 (fails WCAG AA for this
          // 12px/600 text); foreground clears AA with wide margin (≈11:1) and
          // reads as Jira's darker, more prominent count numerals. Guarded in
          // styles/jira-contrast.test.ts.
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-border px-1.5 text-xs font-semibold text-foreground"
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
