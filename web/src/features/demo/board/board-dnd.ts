import { STATUS_ORDER, type Status } from "../data/types.ts";

// Pure drag-and-drop mapping for the board, kept out of the Board component so it
// is unit-testable without simulating real pointer drags and so the component
// file only exports a component (React Fast-Refresh friendly).

// A drop's `over.id` is the droppable's id. Columns register their id as the
// Status string, so a valid drop target is one of STATUS_ORDER. resolveDropStatus
// narrows the unknown drop id to a Status, or returns null when the card was
// released outside any column (no drop target) or onto an unrecognised target —
// in which case the board does nothing and the card snaps back.
export function resolveDropStatus(
  overId: string | number | null | undefined,
): Status | null {
  // @dnd-kit ids are `string | number`; columns register string Status ids, so
  // a non-string id (or null/undefined) can never be a valid column — reject it
  // explicitly rather than relying on a string/number includes() mismatch.
  if (typeof overId !== "string") {
    return null;
  }
  return STATUS_ORDER.includes(overId as Status) ? (overId as Status) : null;
}
