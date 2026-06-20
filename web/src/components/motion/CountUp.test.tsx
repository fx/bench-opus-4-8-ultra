import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { CountUpClock } from "./CountUp.tsx";

const reducedRef = { value: false };
vi.mock("./use-reduced-motion-safe.ts", () => ({
  useReducedMotionSafe: () => reducedRef.value,
}));

import { CountUp } from "./CountUp.tsx";

// A manual clock: tests push frame callbacks and advance `time` deterministically
// so the rAF loop runs without real timers.
function makeClock() {
  let time = 0;
  const queue: ((t: number) => void)[] = [];
  let nextHandle = 1;
  const cancelled = new Set<number>();
  const clock: CountUpClock = {
    now: () => time,
    requestFrame: (cb) => {
      const handle = nextHandle++;
      queue.push((t) => {
        if (!cancelled.has(handle)) cb(t);
      });
      return handle;
    },
    cancelFrame: (handle) => cancelled.add(handle),
  };
  return {
    clock,
    advance(to: number) {
      time = to;
      const frames = queue.splice(0, queue.length);
      act(() => {
        frames.forEach((cb) => cb(time));
      });
    },
    pending: () => queue.length,
  };
}

describe("CountUp", () => {
  beforeEach(() => {
    reducedRef.value = false;
  });

  it("starts at the from value before any frame", () => {
    const c = makeClock();
    render(<CountUp to={100} from={0} durationMs={1000} clock={c.clock} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("animates toward the target across frames and lands exactly on it", () => {
    const c = makeClock();
    render(<CountUp to={100} from={0} durationMs={1000} clock={c.clock} />);
    c.advance(500);
    const mid = Number(screen.getByText(/\d/).textContent);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
    // Past the duration the value clamps to the exact target and stops.
    c.advance(1000);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(c.pending()).toBe(0);
  });

  it("renders the final value immediately under reduced motion", () => {
    reducedRef.value = true;
    const c = makeClock();
    render(<CountUp to={42} from={0} durationMs={1000} clock={c.clock} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    // No frame is scheduled when reduced motion short-circuits.
    expect(c.pending()).toBe(0);
  });

  it("formats decimals, prefix, and suffix", () => {
    reducedRef.value = true;
    render(<CountUp to={12.3456} decimals={2} prefix="$" suffix="k" />);
    expect(screen.getByText("$12.35k")).toBeInTheDocument();
  });

  it("jumps straight to the target when duration is non-positive", () => {
    const c = makeClock();
    render(<CountUp to={9} from={1} durationMs={0} clock={c.clock} />);
    c.advance(0);
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("cancels the pending frame on unmount", () => {
    const c = makeClock();
    const cancelSpy = vi.spyOn(c.clock, "cancelFrame");
    const { unmount } = render(
      <CountUp to={100} from={0} durationMs={1000} clock={c.clock} />,
    );
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it("uses default props (from=0, decimals=0) when omitted", () => {
    reducedRef.value = true;
    render(<CountUp to={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("drives a real frame via the default rAF/performance clock", async () => {
    // Exercise the default clock (requestAnimationFrame + performance.now +
    // cancelAnimationFrame) rather than the injectable one. We let real frames
    // tick and assert the value progresses, then unmount to fire cancelFrame.
    let now = 1000;
    const perfSpy = vi.spyOn(performance, "now").mockImplementation(() => now);
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        now += 50;
        setTimeout(() => cb(now), 0);
        return 1;
      });
    const cancelSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});

    const { unmount } = render(<CountUp to={100} from={0} durationMs={100} />);
    // Let queued frames flush; after >100ms elapsed the value reaches 100.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByText("100")).toBeInTheDocument();

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    expect(rafSpy).toHaveBeenCalled();
    expect(perfSpy).toHaveBeenCalled();
    perfSpy.mockRestore();
    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });
});
