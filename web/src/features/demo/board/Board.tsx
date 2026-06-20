import { useMemo, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Issue } from "../data/types.ts";
import { columnsFromIssues, useDemoStore } from "../store/store.ts";
import { resolveDropStatus } from "./board-dnd.ts";
import { boardKeyboardCoordinateGetter } from "./board-keyboard.ts";
import { Column } from "./Column.tsx";

// The Kanban board (see docs/specs/demo-jira-clone › Kanban Board). It renders
// the four ordered columns (To Do · In Progress · In Review · Done) from store
// selectors — so column membership and live counts are always derived from
// state — and wires drag-and-drop between them via a single @dnd-kit DndContext.
//
// Drag transition logic lives in the store (`moveIssue`, pure + unit-tested);
// the board only translates a drop event into the target Status (via the pure
// `resolveDropStatus` in board-dnd.ts) and dispatches.

export interface BoardProps {
  // Threaded to cards: open the issue detail (0006).
  onOpenIssue?: (key: string) => void;
  // Threaded to cards: the per-issue AI action slot (0007).
  renderAiSlot?: (issue: Issue) => ReactNode;
}

export function Board({ onOpenIssue, renderAiSlot }: BoardProps) {
  // Subscribe to the raw issues array (a stable reference that only changes when
  // the store swaps it, e.g. on a real move) and derive the columns with a memo.
  // Selecting `issues` directly — rather than `useDemoStore(selectColumns)` —
  // avoids returning a fresh object from the selector on every render, which
  // would defeat Zustand's reference equality and loop infinitely.
  const issues = useDemoStore((state) => state.issues);
  const moveIssue = useDemoStore((state) => state.moveIssue);

  // Columns (status + its issues) recomputed only when `issues` changes, so
  // counts and membership stay live across drops without churning every render.
  const columns = useMemo(() => columnsFromIssues(issues), [issues]);

  // Pointer sensor with a small activation distance so a click (open detail)
  // isn't swallowed as a drag; keyboard sensor for accessible drag (Space to
  // pick up, arrows to move, Space to drop) per the change-0005 a11y goal. The
  // custom coordinate getter makes one arrow press jump a whole column (the
  // default getter steps 25px, which is unusable across ~288px columns).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: boardKeyboardCoordinateGetter,
    }),
  );

  // Translate a finished drag into a store transition. `active.id` is the issue
  // key (Card's draggable id); `over` is the column it was released on. A drop
  // outside any column, or onto the column the card already lives in, is a
  // no-op (resolveDropStatus → null, or moveIssue's same-column guard).
  function handleDragEnd(event: DragEndEvent) {
    const status = resolveDropStatus(event.over?.id);
    if (status === null) {
      return;
    }
    moveIssue(String(event.active.id), status);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section
        aria-label="Kanban board"
        className="flex gap-3 overflow-x-auto pb-4"
      >
        {columns.map(({ status, issues }) => (
          <Column
            key={status}
            status={status}
            issues={issues}
            onOpenIssue={onOpenIssue}
            renderAiSlot={renderAiSlot}
          />
        ))}
      </section>
    </DndContext>
  );
}
