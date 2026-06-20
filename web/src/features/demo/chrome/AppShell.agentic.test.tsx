import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./AppShell.tsx";
import { useDemoStore } from "../store/store.ts";

// End-to-end-ish coverage of the 0007 wiring at the composition root: the
// Autopilot toggle on the board, the Rovo Agents roster view, the card AI slot
// opening the detail + running the agent, and the detail's AI-generate slots.
// The AppShell uses react-router Links (TopNav wordmark) so it's wrapped in a
// MemoryRouter.

function renderShell() {
  return render(
    <MemoryRouter>
      <AppShell />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useDemoStore.getState().reset();
  // Default: motion allowed (so streaming uses the clock, not instant fast-fwd).
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AppShell — board chrome (0007)", () => {
  it("renders the Agentic Autopilot toggle on the board", () => {
    renderShell();
    expect(
      screen.getByRole("switch", { name: "Agentic Autopilot" }),
    ).toBeInTheDocument();
  });

  it("switches to the Rovo Agents roster via the sidebar", async () => {
    renderShell();
    // Board header visible initially; roster not.
    expect(screen.queryByTestId("agents-roster")).not.toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Rovo Agents" }));
    });
    expect(screen.getByTestId("agents-roster")).toBeInTheDocument();
    // The board (and its Autopilot toggle) is replaced by the roster.
    expect(
      screen.queryByRole("switch", { name: "Agentic Autopilot" }),
    ).not.toBeInTheDocument();
    // The main landmark label tracks the active view for screen readers.
    expect(
      screen.getByRole("main", { name: "Rovo Agents" }),
    ).toBeInTheDocument();
  });
});

describe("AppShell — card AI slot runs the agent end to end", () => {
  it("starts a run from a card, opens the detail, streams, and ships to Done", () => {
    vi.useFakeTimers();
    renderShell();

    // Find SLOP-101's card and click its (hover) AI action. The slot button is
    // present in the DOM even though visually hidden until hover.
    const card = screen
      .getAllByTestId("board-card")
      .find((c) => c.getAttribute("data-issue-key") === "SLOP-101")!;
    act(() => {
      fireEvent.click(within(card).getByTestId("implement-with-ai"));
    });

    // The detail opened for SLOP-101 and the agent panel is streaming.
    expect(useDemoStore.getState().selectedIssueKey).toBe("SLOP-101");
    expect(screen.getByTestId("agent-panel")).toHaveAttribute(
      "data-run-status",
      "running",
    );
    // While running, the detail's full-width start button is hidden
    // (hasRunForIssue is true) — assert it's absent from the detail itself, not
    // just the panel.
    expect(
      within(screen.getByTestId("issue-detail")).queryByRole("button", {
        name: "Implement SLOP-101 now with AI",
      }),
    ).not.toBeInTheDocument();

    // Fast-forward the whole run.
    const total = useDemoStore
      .getState()
      .agentRun!.steps.reduce((s, step) => s + step.durationMs, 0);
    act(() => {
      vi.advanceTimersByTime(total + 200);
    });

    expect(screen.getByTestId("agent-done")).toBeInTheDocument();
    expect(
      useDemoStore.getState().issues.find((i) => i.key === "SLOP-101")!.status,
    ).toBe("done");
  });
});

describe("AppShell — detail AI-generate slots", () => {
  it("AI-generates the description and a Rovo reply from the detail slots", () => {
    renderShell();
    act(() => useDemoStore.getState().openIssue("SLOP-102"));

    const detail = screen.getByTestId("issue-detail");
    const before = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-102")!;

    // Description AI-generate.
    const describeBtn = within(detail).getByRole("button", {
      name: "AI-generate description",
    });
    act(() => fireEvent.click(describeBtn));
    const afterDesc = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-102")!;
    expect(afterDesc.description).not.toBe(before.description);
    expect(afterDesc.description).toContain("Acceptance criteria:");

    // Reply with AI → agent-authored comment appended.
    const replyBtn = within(detail).getByRole("button", {
      name: "Reply with AI",
    });
    act(() => fireEvent.click(replyBtn));
    const afterReply = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-102")!;
    expect(afterReply.comments[0].byAgent).toBe(true);
  });

  it("AI-rewrites the summary from the detail summary slot", () => {
    renderShell();
    act(() => useDemoStore.getState().openIssue("SLOP-102"));
    const detail = screen.getByTestId("issue-detail");
    const rewrite = within(detail).getByRole("button", {
      name: "AI-generate summary",
    });
    act(() => fireEvent.click(rewrite));
    expect(
      useDemoStore.getState().issues.find((i) => i.key === "SLOP-102")!.summary,
    ).toContain("[AI]");
  });

  it("shows the start button in the detail agent slot when no run is active", () => {
    renderShell();
    act(() => useDemoStore.getState().openIssue("SLOP-102"));
    const detail = screen.getByTestId("issue-detail");
    // hasRunForIssue is false → the full-width start button renders.
    expect(
      within(detail).getByRole("button", {
        name: "Implement SLOP-102 now with AI",
      }),
    ).toBeInTheDocument();
  });
});
