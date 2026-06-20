import { describe, it, expect, vi } from "vitest";
import { KeyboardCode } from "@dnd-kit/core";
import {
  arrowStep,
  boardKeyboardCoordinateGetter,
  nextColumnCoordinates,
  type ColumnRect,
} from "./board-keyboard.ts";

// Four columns laid out left→right at x = 100, 400, 700, 1000 (all on the same
// row, y = 50), matching the board's single horizontal lane.
const COLUMNS: ColumnRect[] = [
  { status: "todo", centerX: 100, centerY: 50 },
  { status: "in_progress", centerX: 400, centerY: 50 },
  { status: "in_review", centerX: 700, centerY: 50 },
  { status: "done", centerX: 1000, centerY: 50 },
];

describe("nextColumnCoordinates", () => {
  it("moves one column right on ArrowRight", () => {
    expect(
      nextColumnCoordinates(KeyboardCode.Right, { x: 100, y: 50 }, COLUMNS),
    ).toEqual({ x: 400, y: 50 });
  });

  it("moves one column left on ArrowLeft", () => {
    expect(
      nextColumnCoordinates(KeyboardCode.Left, { x: 700, y: 50 }, COLUMNS),
    ).toEqual({ x: 400, y: 50 });
  });

  it("treats ArrowDown like 'next' and ArrowUp like 'previous'", () => {
    expect(
      nextColumnCoordinates(KeyboardCode.Down, { x: 100, y: 50 }, COLUMNS),
    ).toEqual({ x: 400, y: 50 });
    expect(
      nextColumnCoordinates(KeyboardCode.Up, { x: 400, y: 50 }, COLUMNS),
    ).toEqual({ x: 100, y: 50 });
  });

  it("snaps from a position between columns to the nearest, then steps", () => {
    // x=350 is nearest to in_progress (400); one right → in_review (700).
    expect(
      nextColumnCoordinates(KeyboardCode.Right, { x: 350, y: 50 }, COLUMNS),
    ).toEqual({ x: 700, y: 50 });
  });

  it("returns null at the right edge (no wrap)", () => {
    expect(
      nextColumnCoordinates(KeyboardCode.Right, { x: 1000, y: 50 }, COLUMNS),
    ).toBeNull();
  });

  it("returns null at the left edge (no wrap)", () => {
    expect(
      nextColumnCoordinates(KeyboardCode.Left, { x: 100, y: 50 }, COLUMNS),
    ).toBeNull();
  });

  it("returns null for a non-horizontal key", () => {
    expect(
      nextColumnCoordinates(KeyboardCode.Space, { x: 100, y: 50 }, COLUMNS),
    ).toBeNull();
  });

  it("returns null when there are no columns", () => {
    expect(
      nextColumnCoordinates(KeyboardCode.Right, { x: 0, y: 0 }, []),
    ).toBeNull();
  });

  it("returns null when no columns match a known status (all filtered out)", () => {
    // A column whose status isn't in STATUS_ORDER can't happen via types, but
    // guard the ordered-empty branch with a cast to be safe.
    const bogus = [
      { status: "nope" as ColumnRect["status"], centerX: 1, centerY: 1 },
    ];
    expect(
      nextColumnCoordinates(KeyboardCode.Right, { x: 1, y: 1 }, bogus),
    ).toBeNull();
  });
});

// Build a minimal SensorContext-like object the adapter reads from.
function makeContext(
  rects: { id: string; left: number; top: number; w: number; h: number }[],
) {
  const droppableRects = new Map(
    rects.map((r) => [
      r.id,
      { left: r.left, top: r.top, width: r.w, height: r.h },
    ]),
  );
  // The adapter reads droppableContainers via .keys(), so model it as a Map
  // (DroppableContainersMap extends Map<id, container> in @dnd-kit).
  const droppableContainers = new Map(rects.map((r) => [r.id, { id: r.id }]));
  // Cast through unknown: we only use the two fields the adapter reads.
  return {
    droppableContainers,
    droppableRects,
  } as unknown as Parameters<
    typeof boardKeyboardCoordinateGetter
  >[1]["context"];
}

function makeEvent(code: string): KeyboardEvent {
  return {
    code,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
}

describe("boardKeyboardCoordinateGetter (dnd adapter)", () => {
  it("returns the adjacent column centre and prevents default on a horizontal move", () => {
    const context = makeContext([
      { id: "todo", left: 0, top: 0, w: 200, h: 100 }, // centre (100, 50)
      { id: "in_progress", left: 300, top: 0, w: 200, h: 100 }, // (400, 50)
    ]);
    const event = makeEvent(KeyboardCode.Right);
    const result = boardKeyboardCoordinateGetter(event, {
      active: "SLOP-101",
      currentCoordinates: { x: 100, y: 50 },
      context,
    });
    expect(result).toEqual({ x: 400, y: 50 });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("ignores non-column droppables and missing rects", () => {
    const context = makeContext([
      { id: "todo", left: 0, top: 0, w: 200, h: 100 },
      { id: "in_progress", left: 300, top: 0, w: 200, h: 100 },
    ]);
    // Add a non-column container (non-status id is skipped by STATUS_ORDER).
    (context.droppableContainers as unknown as Map<string, { id: string }>).set(
      "garbage-zone",
      { id: "garbage-zone" },
    );
    context.droppableRects.delete("in_progress"); // force the "no rect" skip
    const event = makeEvent(KeyboardCode.Right);
    const result = boardKeyboardCoordinateGetter(event, {
      active: "SLOP-101",
      currentCoordinates: { x: 100, y: 50 },
      context,
    });
    // Only `todo` remained a valid column → no column to the right → no move,
    // but the arrow key still preventDefaults so the page doesn't scroll.
    expect(result).toBeUndefined();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("preventDefaults an arrow at the board edge even though the card can't move", () => {
    const context = makeContext([
      { id: "todo", left: 0, top: 0, w: 200, h: 100 }, // centre (100, 50)
      { id: "in_progress", left: 300, top: 0, w: 200, h: 100 }, // (400, 50)
    ]);
    const event = makeEvent(KeyboardCode.Right);
    // Card is at the rightmost column (in_progress, x≈400) → no further move.
    const result = boardKeyboardCoordinateGetter(event, {
      active: "SLOP-101",
      currentCoordinates: { x: 400, y: 50 },
      context,
    });
    expect(result).toBeUndefined();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("returns undefined and does NOT preventDefault for a non-arrow key", () => {
    const context = makeContext([
      { id: "todo", left: 0, top: 0, w: 200, h: 100 },
      { id: "in_progress", left: 300, top: 0, w: 200, h: 100 },
    ]);
    const event = makeEvent(KeyboardCode.Space);
    const result = boardKeyboardCoordinateGetter(event, {
      active: "SLOP-101",
      currentCoordinates: { x: 100, y: 50 },
      context,
    });
    expect(result).toBeUndefined();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe("arrowStep", () => {
  it("maps Left/Up to -1 (previous column)", () => {
    expect(arrowStep(KeyboardCode.Left)).toBe(-1);
    expect(arrowStep(KeyboardCode.Up)).toBe(-1);
  });

  it("maps Right/Down to +1 (next column)", () => {
    expect(arrowStep(KeyboardCode.Right)).toBe(1);
    expect(arrowStep(KeyboardCode.Down)).toBe(1);
  });

  it("maps any other key to 0", () => {
    expect(arrowStep(KeyboardCode.Space)).toBe(0);
    expect(arrowStep(KeyboardCode.Enter)).toBe(0);
  });
});
