import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { AgentPanel } from "./AgentPanel.tsx";
import { totalDurationMs } from "./agent-engine.ts";
import { useDemoStore } from "../store/store.ts";
import type { Issue } from "../data/types.ts";

// AgentPanel is a PURE projection of the store's run state — it no longer owns a
// clock (the shell-level useDemoClocks does). These tests therefore advance the
// run by calling the store action directly, then assert the panel re-renders to
// match. The clock/cadence + reduced-motion behaviour is covered by
// use-demo-clocks.test.tsx.

function getIssue(key: string): Issue {
  return useDemoStore.getState().issues.find((i) => i.key === key)!;
}

// Advance the active run by an explicit delta via the store (what the shell clock
// would do), wrapped in act so React flushes the re-render.
function advance(deltaMs: number) {
  act(() => {
    useDemoStore.getState().advanceAgent(deltaMs);
  });
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
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe("AgentPanel — no active run for this issue", () => {
  it("renders nothing when there is no run", () => {
    const { container } = render(<AgentPanel issue={getIssue("SLOP-101")} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the run targets a DIFFERENT issue", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-102"));
    const { container } = render(<AgentPanel issue={getIssue("SLOP-101")} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("AgentPanel — streaming projection", () => {
  it("shows a running step with a caret at the start", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<AgentPanel issue={getIssue("SLOP-101")} />);

    expect(screen.getByTestId("agent-panel")).toHaveAttribute(
      "data-run-status",
      "running",
    );
    expect(screen.getByTestId("agent-caret")).toBeInTheDocument();
    const steps = screen.getAllByTestId("agent-step");
    expect(steps[0]).toHaveAttribute("data-step-state", "running");
    expect(steps[1]).toHaveAttribute("data-step-state", "pending");
  });

  it("streams the first step's output incrementally as the run advances", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<AgentPanel issue={getIssue("SLOP-101")} />);
    const firstStep = useDemoStore.getState().agentRun!.steps[0];

    // Partway into the first step: some — but not all — of its words show.
    advance(Math.floor(firstStep.durationMs / 2));
    const running = screen.getAllByTestId("agent-step")[0];
    const text = running.textContent ?? "";
    expect(text.length).toBeGreaterThan(firstStep.label.length);
    expect(text).not.toContain(firstStep.output); // not the full output yet
    expect(screen.getByTestId("agent-caret")).toBeInTheDocument();
  });

  it("transitions steps running→done in order and ships on completion", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<AgentPanel issue={getIssue("SLOP-101")} />);
    const total = totalDurationMs(useDemoStore.getState().agentRun!.steps);

    advance(total);

    expect(screen.getByTestId("agent-panel")).toHaveAttribute(
      "data-run-status",
      "done",
    );
    for (const step of screen.getAllByTestId("agent-step")) {
      expect(step).toHaveAttribute("data-step-state", "done");
    }
    expect(screen.queryByTestId("agent-caret")).not.toBeInTheDocument();
    expect(screen.getByTestId("agent-done")).toBeInTheDocument();
    expect(getIssue("SLOP-101").status).toBe("done");
    expect(getIssue("SLOP-101").handledByAgent).toBe(true);
  });

  it("cancels mid-run and leaves the issue NOT Done", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<AgentPanel issue={getIssue("SLOP-101")} />);
    advance(300);

    act(() => {
      fireEvent.click(screen.getByTestId("agent-cancel"));
    });

    expect(screen.getByTestId("agent-panel")).toHaveAttribute(
      "data-run-status",
      "cancelled",
    );
    expect(screen.getByTestId("agent-cancelled")).toBeInTheDocument();
    expect(getIssue("SLOP-101").status).toBe("todo");
    expect(getIssue("SLOP-101").handledByAgent).toBeUndefined();
  });

  it("dismisses a finished run via the Dismiss button", () => {
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    const { rerender } = render(<AgentPanel issue={getIssue("SLOP-101")} />);
    advance(totalDurationMs(useDemoStore.getState().agentRun!.steps));

    act(() => {
      fireEvent.click(screen.getByTestId("agent-dismiss"));
    });
    expect(useDemoStore.getState().agentRun).toBeNull();
    rerender(<AgentPanel issue={getIssue("SLOP-101")} />);
    expect(screen.queryByTestId("agent-panel")).not.toBeInTheDocument();
  });

  it("under reduced motion renders the final streamed text with no blinking caret", () => {
    installMatchMedia(true);
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<AgentPanel issue={getIssue("SLOP-101")} />);
    // The shell clock isn't mounted here; drive to completion as it would. The
    // panel must render the done state WITHOUT any animate-pulse caret.
    advance(totalDurationMs(useDemoStore.getState().agentRun!.steps));
    expect(screen.queryByTestId("agent-caret")).not.toBeInTheDocument();
    expect(screen.getByTestId("agent-done")).toBeInTheDocument();
  });

  it("does not spin the loader or blink the caret under reduced motion mid-run", () => {
    installMatchMedia(true);
    act(() => useDemoStore.getState().startAgent("SLOP-101"));
    render(<AgentPanel issue={getIssue("SLOP-101")} />);
    // Mid-run under reduced motion: the running step shows a static caret (no
    // animate-pulse class) and the spinner has no animate-spin.
    const caret = screen.getByTestId("agent-caret");
    expect(caret.className).not.toContain("animate-pulse");
    const panel = screen.getByTestId("agent-panel");
    expect(panel.querySelector(".animate-spin")).toBeNull();
  });
});
