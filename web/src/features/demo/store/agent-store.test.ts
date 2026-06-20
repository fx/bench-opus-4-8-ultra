import { describe, it, expect, beforeEach } from "vitest";
import {
  agentUser,
  applyAgentCompletion,
  selectAgentRunIssue,
  useDemoStore,
  type DemoState,
} from "./store.ts";
import type { User } from "../data/types.ts";
import { totalDurationMs } from "../agent/agent-engine.ts";
import { ROVO_ANSWER_COUNT } from "../rovo/ask-rovo.ts";

// 0007 store actions: the agent run lifecycle (start/advance/cancel/clear) with
// completion side-effects, Autopilot ticking, Ask Rovo, AI-generate, and view
// routing. The engine is pure, so these advance the run by passing explicit
// deltas — no real timers.

beforeEach(() => {
  useDemoStore.getState().reset();
});

// A clock that returns a fixed timestamp, for deterministic mutation stamps.
const fixedClock = (t: number) => () => t;

describe("startAgent", () => {
  it("starts a running run scripted for the issue", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    const run = useDemoStore.getState().agentRun;
    expect(run).not.toBeNull();
    expect(run?.issueKey).toBe("SLOP-101");
    expect(run?.status).toBe("running");
    expect(run?.elapsedMs).toBe(0);
  });

  it("is a no-op (same reference) for an unknown key", () => {
    const before = useDemoStore.getState();
    before.startAgent("NOPE-1");
    expect(useDemoStore.getState().agentRun).toBeNull();
    // No issues churn either.
    expect(useDemoStore.getState().issues).toBe(before.issues);
  });
});

describe("advanceAgent", () => {
  it("streams incrementally without finishing partway through", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    const total = totalDurationMs(useDemoStore.getState().agentRun!.steps);
    // Advance less than the total → still running, elapsed accumulated.
    useDemoStore.getState().advanceAgent(Math.floor(total / 2));
    const run = useDemoStore.getState().agentRun!;
    expect(run.status).toBe("running");
    expect(run.elapsedMs).toBeGreaterThan(0);
    expect(run.elapsedMs).toBeLessThan(total);
    // The targeted issue is NOT yet Done.
    const issue = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    expect(issue.status).toBe("todo");
    expect(issue.handledByAgent).toBeUndefined();
  });

  it("ships the issue to Done, marks it agent-handled, and logs the run on completion", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    const before = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    const commentsBefore = before.comments.length;
    // One huge delta finishes the run.
    useDemoStore.getState().advanceAgent(1_000_000, fixedClock(50_000));
    const run = useDemoStore.getState().agentRun!;
    expect(run.status).toBe("done");
    const issue = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    expect(issue.status).toBe("done");
    expect(issue.handledByAgent).toBe(true);
    expect(issue.updatedAt).toBe(50_000);
    // An agent-authored run-log comment was prepended.
    expect(issue.comments.length).toBe(commentsBefore + 1);
    const log = issue.comments[0];
    expect(log.byAgent).toBe(true);
    expect(log.author.isAgent).toBe(true);
    expect(log.body).toContain("SLOP-101");
  });

  it("is a no-op (same reference) when there is no run", () => {
    const before = useDemoStore.getState();
    before.advanceAgent(100);
    expect(useDemoStore.getState().agentRun).toBeNull();
    expect(useDemoStore.getState().issues).toBe(before.issues);
  });

  it("gives each completion of the same issue a DISTINCT comment id (no dup keys)", () => {
    // Ship SLOP-101 twice under the SAME fixed clock; the two agent run-log
    // comments must still get distinct ids (the feed keys off comment.id).
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().advanceAgent(1_000_000, fixedClock(42));
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().advanceAgent(1_000_000, fixedClock(42));
    const issue = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    const agentLogIds = issue.comments
      .filter((c) => c.id.startsWith("ac-SLOP-101-"))
      .map((c) => c.id);
    expect(agentLogIds.length).toBe(2);
    expect(new Set(agentLogIds).size).toBe(2);
  });

  it("is a no-op for a non-positive delta", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    const run = useDemoStore.getState().agentRun;
    useDemoStore.getState().advanceAgent(0);
    expect(useDemoStore.getState().agentRun).toBe(run);
    useDemoStore.getState().advanceAgent(-10);
    expect(useDemoStore.getState().agentRun).toBe(run);
  });

  it("is a no-op once the run has finished (does not re-fire side-effects)", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().advanceAgent(1_000_000, fixedClock(1));
    const finishedRun = useDemoStore.getState().agentRun;
    const issuesAfterFinish = useDemoStore.getState().issues;
    // Advancing a done run does nothing further.
    useDemoStore.getState().advanceAgent(1_000_000, fixedClock(2));
    expect(useDemoStore.getState().agentRun).toBe(finishedRun);
    expect(useDemoStore.getState().issues).toBe(issuesAfterFinish);
  });
});

describe("cancelAgent", () => {
  it("cancels a running run and leaves the issue NOT Done", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().advanceAgent(500);
    useDemoStore.getState().cancelAgent();
    const run = useDemoStore.getState().agentRun!;
    expect(run.status).toBe("cancelled");
    const issue = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    expect(issue.status).toBe("todo");
    expect(issue.handledByAgent).toBeUndefined();
  });

  it("is a no-op (same reference) when there is no run", () => {
    const before = useDemoStore.getState();
    before.cancelAgent();
    expect(useDemoStore.getState().agentRun).toBeNull();
  });

  it("is a no-op (same reference) for an already-finished run", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().advanceAgent(1_000_000);
    const finished = useDemoStore.getState().agentRun;
    useDemoStore.getState().cancelAgent();
    expect(useDemoStore.getState().agentRun).toBe(finished);
  });
});

describe("clearAgentRun", () => {
  it("clears an existing run", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().clearAgentRun();
    expect(useDemoStore.getState().agentRun).toBeNull();
  });

  it("is a no-op (same reference) when there is no run", () => {
    const before = useDemoStore.getState();
    before.clearAgentRun();
    expect(useDemoStore.getState()).toBe(before);
  });
});

describe("selectAgentRunIssue", () => {
  it("resolves the run's issue, or undefined when no run", () => {
    expect(selectAgentRunIssue(useDemoStore.getState())).toBeUndefined();
    useDemoStore.getState().startAgent("SLOP-101");
    expect(selectAgentRunIssue(useDemoStore.getState())?.key).toBe("SLOP-101");
  });
});

describe("toggleAutopilot", () => {
  it("turns Autopilot on", () => {
    useDemoStore.getState().toggleAutopilot();
    expect(useDemoStore.getState().autopilotEnabled).toBe(true);
  });

  it("turns it off and resets the schedule", () => {
    const s = useDemoStore.getState();
    s.toggleAutopilot(); // on
    s.tickAutopilot(100); // accumulate some time
    expect(useDemoStore.getState().autopilotElapsedMs).toBeGreaterThan(0);
    useDemoStore.getState().toggleAutopilot(); // off
    const state = useDemoStore.getState();
    expect(state.autopilotEnabled).toBe(false);
    expect(state.autopilotElapsedMs).toBe(0);
    expect(state.autopilotMoves).toBe(0);
  });
});

describe("tickAutopilot", () => {
  it("is a no-op (same reference) while OFF", () => {
    const before = useDemoStore.getState();
    before.tickAutopilot(5000);
    expect(useDemoStore.getState().issues).toBe(before.issues);
    expect(useDemoStore.getState().autopilotElapsedMs).toBe(0);
  });

  it("is a no-op for a non-positive delta even while ON", () => {
    useDemoStore.getState().toggleAutopilot();
    const on = useDemoStore.getState();
    on.tickAutopilot(0);
    expect(useDemoStore.getState()).toBe(on);
    on.tickAutopilot(-1);
    expect(useDemoStore.getState()).toBe(on);
  });

  it("accumulates time without moving until the interval elapses", () => {
    useDemoStore.getState().toggleAutopilot();
    const before = useDemoStore.getState().issues;
    // A tiny tick is below the (≥750ms) jittered interval → no move.
    useDemoStore.getState().tickAutopilot(100);
    expect(useDemoStore.getState().issues).toBe(before);
    expect(useDemoStore.getState().autopilotElapsedMs).toBe(100);
  });

  it("advances the first not-Done issue one column when the interval elapses", () => {
    useDemoStore.getState().toggleAutopilot();
    const firstTodo = useDemoStore
      .getState()
      .issues.find((i) => i.status === "todo")!;
    // A large tick definitely crosses the jittered interval (< 2250ms).
    useDemoStore.getState().tickAutopilot(5000, fixedClock(123));
    const moved = useDemoStore
      .getState()
      .issues.find((i) => i.key === firstTodo.key)!;
    expect(moved.status).toBe("in_progress");
    expect(moved.updatedAt).toBe(123);
    // The clock + move counter reset/advance for the next interval.
    expect(useDemoStore.getState().autopilotElapsedMs).toBe(0);
    expect(useDemoStore.getState().autopilotMoves).toBe(1);
  });

  it("eventually ships every issue to Done across repeated ticks, then idles", () => {
    useDemoStore.getState().toggleAutopilot();
    // Hammer the clock; each large tick makes at most one move. 100 ticks is far
    // more than enough to push all 14 issues (≤3 columns each) to Done.
    for (let i = 0; i < 100; i += 1) {
      useDemoStore.getState().tickAutopilot(5000);
    }
    const allDone = useDemoStore
      .getState()
      .issues.every((i) => i.status === "done");
    expect(allDone).toBe(true);
    // With everything Done, a further tick finds no target → a TRUE no-op: the
    // whole state reference is unchanged (the store stops churning every tick).
    const before = useDemoStore.getState();
    before.tickAutopilot(5000);
    expect(useDemoStore.getState()).toBe(before);
  });

  it("does NOT advance the issue a manual agent run is implementing", () => {
    // Start a run on the FIRST not-Done seed issue (the one Autopilot would
    // otherwise pick first), then enable Autopilot and tick.
    const firstTodo = useDemoStore
      .getState()
      .issues.find((i) => i.status === "todo")!;
    useDemoStore.getState().startAgent(firstTodo.key);
    useDemoStore.getState().toggleAutopilot();
    useDemoStore.getState().tickAutopilot(5000, fixedClock(1));

    // The run's issue is untouched by Autopilot (still todo); a DIFFERENT issue
    // advanced instead.
    const runIssue = useDemoStore
      .getState()
      .issues.find((i) => i.key === firstTodo.key)!;
    expect(runIssue.status).toBe("todo");
    // Cancelling the run still leaves that issue not Done (contract intact).
    useDemoStore.getState().cancelAgent();
    expect(
      useDemoStore.getState().issues.find((i) => i.key === firstTodo.key)!
        .status,
    ).toBe("todo");
  });

  it("idles (no move) when the run's issue is the only thing left to ship", () => {
    // Push every issue to Done except SLOP-101, then run an agent on SLOP-101
    // and enable Autopilot: pickAutopilotTarget excludes it → no move.
    const s = useDemoStore.getState();
    for (const issue of s.issues) {
      if (issue.key !== "SLOP-101") {
        s.setStatus(issue.key, "done", fixedClock(1));
      }
    }
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().toggleAutopilot();
    const before = useDemoStore.getState();
    before.tickAutopilot(5000);
    // No target (only non-Done issue is the excluded run issue) → true no-op:
    // the whole state reference is unchanged.
    expect(useDemoStore.getState()).toBe(before);
  });

  it("halts further movement once toggled OFF", () => {
    useDemoStore.getState().toggleAutopilot();
    useDemoStore.getState().tickAutopilot(5000); // one move
    useDemoStore.getState().toggleAutopilot(); // off
    const after = useDemoStore.getState().issues;
    // Ticks while OFF do nothing.
    useDemoStore.getState().tickAutopilot(5000);
    expect(useDemoStore.getState().issues).toBe(after);
  });
});

describe("askRovo / clearRovoAnswer", () => {
  it("stores a scripted answer for a query", () => {
    useDemoStore.getState().askRovo("ship it?");
    const answer = useDemoStore.getState().rovoAnswer;
    expect(answer).not.toBeNull();
    expect(answer?.citations.length).toBeGreaterThan(0);
  });

  it("clears the answer", () => {
    useDemoStore.getState().askRovo("hi");
    useDemoStore.getState().clearRovoAnswer();
    expect(useDemoStore.getState().rovoAnswer).toBeNull();
  });

  it("clearRovoAnswer is a no-op (same reference) when already null", () => {
    const before = useDemoStore.getState();
    before.clearRovoAnswer();
    expect(useDemoStore.getState()).toBe(before);
  });

  it("reaches multiple distinct answers across queries", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      useDemoStore.getState().askRovo(`q${i}`);
      seen.add(useDemoStore.getState().rovoAnswer!.body);
    }
    expect(seen.size).toBe(ROVO_ANSWER_COUNT);
  });
});

describe("generateSummary / generateDescription / generateReply", () => {
  it("fills the summary with buzzword bloat", () => {
    useDemoStore.getState().generateSummary("SLOP-101", fixedClock(7));
    const issue = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    expect(issue.summary).toContain("[AI]");
    expect(issue.updatedAt).toBe(7);
  });

  it("fills the description with buzzword bloat", () => {
    useDemoStore.getState().generateDescription("SLOP-101", fixedClock(8));
    const issue = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    expect(issue.description).toContain("Acceptance criteria:");
    expect(issue.updatedAt).toBe(8);
  });

  it("appends an agent-authored reply comment", () => {
    const before = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!.comments.length;
    useDemoStore.getState().generateReply("SLOP-101", fixedClock(9));
    const issue = useDemoStore
      .getState()
      .issues.find((i) => i.key === "SLOP-101")!;
    expect(issue.comments.length).toBe(before + 1);
    expect(issue.comments[0].byAgent).toBe(true);
    expect(issue.comments[0].author.isAgent).toBe(true);
    expect(issue.comments[0].id.startsWith("ar-SLOP-101-")).toBe(true);
  });

  it("are all no-ops (same reference) for an unknown key", () => {
    const before = useDemoStore.getState();
    before.generateSummary("NOPE-1");
    expect(useDemoStore.getState().issues).toBe(before.issues);
    before.generateDescription("NOPE-1");
    expect(useDemoStore.getState().issues).toBe(before.issues);
    before.generateReply("NOPE-1");
    expect(useDemoStore.getState().issues).toBe(before.issues);
  });
});

describe("setView", () => {
  it("switches to the roster and back", () => {
    useDemoStore.getState().setView("agents");
    expect(useDemoStore.getState().activeView).toBe("agents");
    useDemoStore.getState().setView("board");
    expect(useDemoStore.getState().activeView).toBe("board");
  });

  it("is a no-op (same reference) when already on the requested view", () => {
    const before = useDemoStore.getState();
    before.setView("board"); // already board
    expect(useDemoStore.getState()).toBe(before);
  });
});

describe("applyAgentCompletion (pure)", () => {
  it("returns the SAME state reference for an unknown key", () => {
    const state = useDemoStore.getState();
    const agent = state.users.find((u) => u.isAgent)!;
    const result = applyAgentCompletion(
      state as DemoState,
      "NOPE-1",
      agent,
      () => 1,
    );
    expect(result).toBe(state);
  });
});

describe("agentUser (pure)", () => {
  it("returns the seed agent when present", () => {
    const agent = agentUser(useDemoStore.getState().users);
    expect(agent.isAgent).toBe(true);
    expect(agent.id).toBe("rovo-ultra");
  });

  it("falls back to a synthetic Rovo Ultra when no agent is in the list", () => {
    const humans: User[] = [
      { id: "h", name: "Human", initials: "HU", avatarColor: "#0052CC" },
    ];
    const agent = agentUser(humans);
    expect(agent.isAgent).toBe(true);
    expect(agent.name).toBe("Rovo Ultra");
  });
});

describe("reset clears 0007 state", () => {
  it("restores agent/autopilot/rovo/view to their initial values", () => {
    const s = useDemoStore.getState();
    s.startAgent("SLOP-101");
    s.toggleAutopilot();
    s.tickAutopilot(100);
    s.askRovo("hi");
    s.setView("agents");
    useDemoStore.getState().reset();
    const state = useDemoStore.getState();
    expect(state.agentRun).toBeNull();
    expect(state.autopilotEnabled).toBe(false);
    expect(state.autopilotElapsedMs).toBe(0);
    expect(state.autopilotMoves).toBe(0);
    expect(state.rovoAnswer).toBeNull();
    expect(state.activeView).toBe("board");
  });
});
