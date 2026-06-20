import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useDemoClocks } from "./use-demo-clocks.ts";
import { totalDurationMs } from "./agent-engine.ts";
import { useDemoStore } from "../store/store.ts";

// useDemoClocks is the shell-level real-timer driver. These tests fake timers and
// assert it advances the agent run + Autopilot from store state alone — with NO
// agent panel / Autopilot toggle mounted — proving the simulations progress
// independent of which UI is visible (the codex unmount-stall fix).

// A bare host that only mounts the clock driver — no panel, no toggle.
function ClockHost() {
  useDemoClocks();
  return null;
}

function installMatchMedia(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: reduced,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  useDemoStore.getState().reset();
  installMatchMedia(false);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe("useDemoClocks — agent run", () => {
  it("advances a running run to completion over time, even with no panel mounted", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<ClockHost />);
    const total = totalDurationMs(useDemoStore.getState().agentRun!.steps);

    // Before any time passes the run is still at the start.
    expect(useDemoStore.getState().agentRun!.elapsedMs).toBe(0);

    act(() => {
      vi.advanceTimersByTime(total + 200);
    });

    // The run shipped the issue purely from the shell clock.
    expect(useDemoStore.getState().agentRun!.status).toBe("done");
    expect(
      useDemoStore.getState().issues.find((i) => i.key === "SLOP-101")!.status,
    ).toBe("done");
  });

  it("stops ticking once the run is cancelled (no further advance)", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<ClockHost />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => useDemoStore.getState().cancelAgent());
    const frozen = useDemoStore.getState().agentRun!.elapsedMs;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Elapsed is frozen at cancel; status stays cancelled.
    expect(useDemoStore.getState().agentRun!.elapsedMs).toBe(frozen);
    expect(useDemoStore.getState().agentRun!.status).toBe("cancelled");
  });

  it("does not tick when there is no run", () => {
    render(<ClockHost />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(useDemoStore.getState().agentRun).toBeNull();
  });

  it("fast-forwards the run to completion immediately under reduced motion", () => {
    installMatchMedia(true);
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    // Mounting the driver under reduced motion finishes the run synchronously —
    // no timer advance needed.
    act(() => {
      render(<ClockHost />);
    });
    expect(useDemoStore.getState().agentRun!.status).toBe("done");
    expect(
      useDemoStore.getState().issues.find((i) => i.key === "SLOP-101")!.status,
    ).toBe("done");
  });
});

describe("useDemoClocks — autopilot", () => {
  it("ships cards over time while Autopilot is ON, independent of the board UI", () => {
    act(() => useDemoStore.getState().toggleAutopilot());
    render(<ClockHost />);
    const firstTodo = useDemoStore
      .getState()
      .issues.find((i) => i.status === "todo")!;

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    const moved = useDemoStore
      .getState()
      .issues.find((i) => i.key === firstTodo.key)!;
    expect(moved.status).not.toBe("todo");
  });

  it("halts when Autopilot is toggled OFF", () => {
    act(() => useDemoStore.getState().toggleAutopilot());
    render(<ClockHost />);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    act(() => useDemoStore.getState().toggleAutopilot()); // OFF
    const after = useDemoStore.getState().issues;
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(useDemoStore.getState().issues).toBe(after);
  });

  it("clears its intervals on unmount (no leaked timers)", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    act(() => useDemoStore.getState().toggleAutopilot());
    const { unmount } = render(<ClockHost />);
    unmount();
    // No pending timers remain after the host unmounts.
    expect(vi.getTimerCount()).toBe(0);
  });
});
