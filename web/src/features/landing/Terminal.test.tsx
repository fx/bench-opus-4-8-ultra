import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { TerminalClock } from "./Terminal.tsx";

const reducedRef = { value: false };
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return { ...actual, useReducedMotionSafe: () => reducedRef.value };
});

import { Terminal } from "./Terminal.tsx";

// A manual clock: tests push timer callbacks into a queue and flush them, so the
// typewriter advances deterministically without real timers.
function makeClock() {
  const queue: { handle: number; cb: () => void }[] = [];
  let nextHandle = 1;
  const cancelled = new Set<number>();
  const clock: TerminalClock = {
    setTimer: (cb) => {
      const handle = nextHandle++;
      queue.push({ handle, cb });
      return handle;
    },
    clearTimer: (handle) => cancelled.add(handle),
  };
  return {
    clock,
    // Flush all currently-queued timers once.
    flush() {
      const pending = queue.splice(0, queue.length);
      act(() => {
        for (const { handle, cb } of pending) {
          if (!cancelled.has(handle)) cb();
        }
      });
    },
    pending: () => queue.length,
  };
}

const LINES = ["ab", "cd"] as const;

describe("Terminal", () => {
  beforeEach(() => {
    reducedRef.value = false;
  });

  it("types characters one at a time then advances lines", () => {
    const c = makeClock();
    render(<Terminal lines={LINES} clock={c.clock} />);
    const term = screen.getByTestId("hero-terminal");

    // Initially nothing typed (in-progress line is empty string).
    expect(term).toBeInTheDocument();

    // Type "a", then "ab" — each flush types one char.
    c.flush();
    expect(term.textContent).toContain("a");
    c.flush();
    expect(term.textContent).toContain("ab");
    // Line complete → pause timer → advance to next line.
    c.flush();
    // Now the first line is "completed" and the second begins.
    c.flush(); // types "c"
    expect(term.textContent).toContain("ab");
    expect(term.textContent).toContain("c");
    // While typing, the in-progress cursor blinks (animate-pulse on).
    expect(term.querySelector(".animate-pulse")).not.toBeNull();
    c.flush(); // types "cd"
    expect(term.textContent).toContain("cd");
    // Line-complete pause → advance past the last line.
    c.flush();
    // All lines done: the steady cursor appears and no further timers schedule.
    const cursor = screen.getByTestId("terminal-cursor");
    expect(cursor).toBeInTheDocument();
    // With motion allowed the steady cursor blinks.
    expect(cursor).toHaveClass("animate-pulse");
    expect(c.pending()).toBe(0);
  });

  it("renders all lines immediately and schedules nothing under reduced motion", () => {
    reducedRef.value = true;
    const c = makeClock();
    render(<Terminal lines={LINES} clock={c.clock} />);
    const term = screen.getByTestId("hero-terminal");
    expect(term.textContent).toContain("ab");
    expect(term.textContent).toContain("cd");
    const cursor = screen.getByTestId("terminal-cursor");
    expect(cursor).toBeInTheDocument();
    // Under reduced motion the cursor does not blink (no infinite animation).
    expect(cursor).not.toHaveClass("animate-pulse");
    expect(c.pending()).toBe(0);
  });

  it("clears the pending timer on unmount", () => {
    const c = makeClock();
    const clearSpy = vi.spyOn(c.clock, "clearTimer");
    const { unmount } = render(<Terminal lines={LINES} clock={c.clock} />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("drives the default window-timer clock when none is injected", () => {
    vi.useFakeTimers();
    try {
      render(<Terminal lines={["x"]} charMs={5} linePauseMs={5} />);
      const term = screen.getByTestId("hero-terminal");
      act(() => {
        vi.advanceTimersByTime(5);
      });
      expect(term.textContent).toContain("x");
      // Advance through the line-complete pause to reach the done state.
      act(() => {
        vi.advanceTimersByTime(5);
      });
      expect(screen.getByTestId("terminal-cursor")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
