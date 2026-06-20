import { KeyboardCode, type KeyboardCoordinateGetter } from "@dnd-kit/core";
import { STATUS_ORDER, type Status } from "../data/types.ts";

// A column-aware keyboard coordinate getter for the board's @dnd-kit
// KeyboardSensor. @dnd-kit's default getter steps a fixed 25px per arrow press,
// so crossing a ~288px column takes a dozen presses — unusable as keyboard DnD.
// This getter instead jumps the dragged card straight to the CENTRE of the
// adjacent column in the arrow's direction, so one Left/Right press moves one
// column (and Up/Down map to the previous/next column too, since the board is a
// single horizontal lane). The pure geometry lives in `nextColumnCoordinates`
// so it is unit-testable without a live drag.

// The arrow keys that move toward the previous (earlier) or next (later) column.
const PREV_KEYS = new Set<string>([KeyboardCode.Left, KeyboardCode.Up]);
const NEXT_KEYS = new Set<string>([KeyboardCode.Right, KeyboardCode.Down]);

export interface ColumnRect {
  status: Status;
  // Centre point of the column's drop area, in the same coordinate space as the
  // dragged card's current coordinates.
  centerX: number;
  centerY: number;
}

// Pure core: given the pressed key, the card's current coordinates, and the
// board's columns (in display order), return the coordinates to move to — the
// centre of the adjacent column — or null when the key isn't a horizontal move
// or there is no column in that direction (already at an end). Columns are
// matched to the current position by nearest centre, then stepped by one in
// STATUS_ORDER.
export function nextColumnCoordinates(
  key: string,
  current: { x: number; y: number },
  columns: ColumnRect[],
): { x: number; y: number } | null {
  const step = PREV_KEYS.has(key) ? -1 : NEXT_KEYS.has(key) ? 1 : 0;
  if (step === 0 || columns.length === 0) {
    return null;
  }
  // Order columns by board display order so "next"/"previous" is stable
  // regardless of DOM/registration order.
  const ordered = STATUS_ORDER.map((status) =>
    columns.find((c) => c.status === status),
  ).filter((c): c is ColumnRect => c !== undefined);
  if (ordered.length === 0) {
    return null;
  }

  // Find the column the card is currently nearest to (by centre X).
  let nearest = 0;
  let best = Infinity;
  ordered.forEach((col, i) => {
    const dist = Math.abs(col.centerX - current.x);
    if (dist < best) {
      best = dist;
      nearest = i;
    }
  });

  const target = nearest + step;
  if (target < 0 || target >= ordered.length) {
    // Already at the first/last column — stay put (no wrap).
    return null;
  }
  const dest = ordered[target];
  return { x: dest.centerX, y: dest.centerY };
}

// The @dnd-kit adapter: reads the live droppable column rects from the sensor
// context, delegates to the pure core, and falls back to "no move" (void) when
// there's nothing to do — @dnd-kit then keeps the card where it is.
export const boardKeyboardCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { currentCoordinates, context },
) => {
  const { droppableContainers, droppableRects } = context;
  const columns: ColumnRect[] = [];
  // droppableContainers is a Map<id, container>; iterate its ids.
  for (const id of droppableContainers.keys()) {
    // Only the four board columns are droppables; their id is the Status string.
    if (!STATUS_ORDER.includes(id as Status)) {
      continue;
    }
    const rect = droppableRects.get(id);
    if (!rect) {
      continue;
    }
    columns.push({
      status: id as Status,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    });
  }

  const next = nextColumnCoordinates(event.code, currentCoordinates, columns);
  if (next === null) {
    return undefined;
  }
  // Prevent the page from scrolling while we reposition the dragged card.
  event.preventDefault();
  return next;
};
