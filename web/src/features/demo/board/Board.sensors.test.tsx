import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Capture the options the Board passes to each useSensor call so we can assert
// the KeyboardSensor is configured to start/end on Space ONLY (not Enter). This
// guards the 0006 wiring: Enter on a focused card opens the issue detail and is
// forwarded to this sensor, so Enter must NOT also begin a keyboard drag.
interface CapturedSensor {
  sensor: unknown;
  options: { keyboardCodes?: { start?: string[]; end?: string[] } } | undefined;
}
const captured: CapturedSensor[] = [];

vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    DndContext: (props: { children: ReactNode }) => <div>{props.children}</div>,
    useSensor: (sensor: unknown, options?: CapturedSensor["options"]) => {
      captured.push({ sensor, options });
      return undefined;
    },
    useSensors: () => [],
  };
});

import { KeyboardSensor } from "@dnd-kit/core";
import { Board } from "./Board.tsx";

describe("Board KeyboardSensor configuration", () => {
  it("starts and ends a keyboard drag on Space only, never Enter", () => {
    captured.length = 0;
    render(<Board />);

    const keyboard = captured.find((c) => c.sensor === KeyboardSensor);
    expect(keyboard).toBeDefined();
    const codes = keyboard?.options?.keyboardCodes;
    expect(codes?.start).toEqual(["Space"]);
    expect(codes?.end).toEqual(["Space"]);
    // Enter is reserved for "open issue detail" — it must not be a drag key.
    expect(codes?.start).not.toContain("Enter");
    expect(codes?.end).not.toContain("Enter");
  });
});
