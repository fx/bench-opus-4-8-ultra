import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { AGENT_TICK_MS, useAgentClock } from "./use-agent-clock.ts";

// The clock shim is the ONLY real timer in 0007. These tests fake timers and
// assert it ticks while active and tears the interval down on deactivate /
// unmount, so a cancelled/finished run never leaves an orphaned timer (the
// cancellation-leak lesson).

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

  it("ticks the interval delta repeatedly while active", () => {
    const onTick = vi.fn();
    render(<Probe active onTick={onTick} />);
    act(() => {
      vi.advanceTimersByTime(AGENT_TICK_MS * 3);
    });
    expect(onTick).toHaveBeenCalledTimes(3);
    expect(onTick).toHaveBeenCalledWith(AGENT_TICK_MS);
  });

  it("respects a custom interval", () => {
    const onTick = vi.fn();
    render(<Probe active onTick={onTick} intervalMs={200} />);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onTick).toHaveBeenCalledTimes(3);
    expect(onTick).toHaveBeenCalledWith(200);
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
