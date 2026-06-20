import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { AGENT_TICK_MS, useAgentClock } from "./use-agent-clock.ts";

// The clock shim is the ONLY real timer in 0007. These tests fake timers and
// assert it reports the REAL MEASURED elapsed time (via performance.now) per tick
// — not a hardcoded interval — and tears the interval down on deactivate /
// unmount (the cancellation-leak lesson).
//
// Vitest's fake timers also fake performance.now(), advancing it in lockstep as
// each interval fires — so for the normal-cadence tests `advanceTimersByTime`
// alone produces deterministic per-tick deltas. The throttling test additionally
// stubs performance.now() to a controlled sequence to prove the hook reports a
// LARGER measured delta when a single fire represents more wall-clock time (the
// background-tab / low-power throttling case).

// A probe component driving the hook with controllable props.
function Probe({
  active,
  onTick,
  intervalMs,
}: {
  active: boolean;
  onTick: (deltaMs: number) => void;
  intervalMs?: number;
}) {
  useAgentClock(active, onTick, intervalMs);
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useAgentClock", () => {
  it("does not tick while inactive", () => {
    const onTick = vi.fn();
    render(<Probe active={false} onTick={onTick} />);
    act(() => {
      vi.advanceTimersByTime(AGENT_TICK_MS * 5);
    });
    expect(onTick).not.toHaveBeenCalled();
  });

  it("ticks with the measured elapsed delta per fire", () => {
    const onTick = vi.fn();
    render(<Probe active onTick={onTick} />);
    // Three intervals fire; the (faked) performance.now advances AGENT_TICK_MS per
    // interval, so each tick reports exactly that measured delta.
    act(() => {
      vi.advanceTimersByTime(AGENT_TICK_MS * 3);
    });
    expect(onTick).toHaveBeenCalledTimes(3);
    for (const call of onTick.mock.calls) {
      expect(call[0]).toBe(AGENT_TICK_MS);
    }
  });

  it("respects a custom scheduling interval", () => {
    const onTick = vi.fn();
    render(<Probe active onTick={onTick} intervalMs={200} />);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onTick).toHaveBeenCalledTimes(3);
    expect(onTick).toHaveBeenCalledWith(200);
  });

  it("reports the REAL elapsed time, not the interval, when a fire is throttled", () => {
    // Stub performance.now() to a controlled sequence: the anchor reads 0, then
    // the single fire reads 1000 — i.e. the tab was throttled and 1000ms of
    // wall-clock passed before the interval got to run. The hook must report the
    // measured 1000ms delta (proving it tracks wall-clock and catches up after
    // throttling) rather than the fixed AGENT_TICK_MS.
    const nowSpy = vi
      .spyOn(performance, "now")
      .mockReturnValueOnce(0) // anchor when the effect starts
      .mockReturnValueOnce(1000); // the throttled fire
    const onTick = vi.fn();
    render(<Probe active onTick={onTick} />);
    act(() => {
      // One interval fires; performance.now() returns the throttled 1000.
      vi.advanceTimersByTime(AGENT_TICK_MS);
    });
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenCalledWith(1000);
    nowSpy.mockRestore();
  });

  it("anchors the elapsed measurement at activation, not at mount", () => {
    const onTick = vi.fn();
    const { rerender } = render(<Probe active={false} onTick={onTick} />);
    // Wall-clock advances a lot WHILE INACTIVE (timers fire nothing since the
    // effect is off). This elapsed time must NOT be attributed to the first tick
    // once active — the effect re-anchors `last` when it (re)starts.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    rerender(<Probe active onTick={onTick} />);
    act(() => {
      vi.advanceTimersByTime(AGENT_TICK_MS);
    });
    expect(onTick).toHaveBeenCalledTimes(1);
    // The first delta is the time since ACTIVATION (AGENT_TICK_MS), not the 5000ms
    // that elapsed while inactive.
    expect(onTick).toHaveBeenCalledWith(AGENT_TICK_MS);
  });

  it("stops ticking when it goes inactive (interval cleared)", () => {
    const onTick = vi.fn();
    const { rerender } = render(<Probe active onTick={onTick} />);
    act(() => {
      vi.advanceTimersByTime(AGENT_TICK_MS);
    });
    expect(onTick).toHaveBeenCalledTimes(1);
    rerender(<Probe active={false} onTick={onTick} />);
    act(() => {
      vi.advanceTimersByTime(AGENT_TICK_MS * 5);
    });
    // No further ticks after deactivation.
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on unmount (no leaked timer)", () => {
    const onTick = vi.fn();
    const { unmount } = render(<Probe active onTick={onTick} />);
    unmount();
    act(() => {
      vi.advanceTimersByTime(AGENT_TICK_MS * 5);
    });
    expect(onTick).not.toHaveBeenCalled();
    // No pending timers remain.
    expect(vi.getTimerCount()).toBe(0);
  });
});
