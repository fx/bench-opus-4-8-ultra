import { describe, it, expect } from "vitest";
import {
  advanceRun,
  cancelRun,
  createAgentRun,
  currentStepIndex,
  isRunFinished,
  stepViews,
  streamedPrefix,
  totalDurationMs,
  type AgentRunState,
} from "./agent-engine.ts";
import type { AgentStep, Issue } from "../data/types.ts";
import { createSeed } from "../data/seed.ts";

// The agent engine is pure: streaming is a function of elapsed time, so these
// tests fast-forward by passing explicit deltas — no real timers, no waits.

// A tiny synthetic step list with round durations so fractions are exact.
const STEPS: AgentStep[] = [
  { id: "s0", label: "Step 0", output: "alpha beta gamma", durationMs: 300 },
  { id: "s1", label: "Step 1", output: "one two", durationMs: 200 },
];

function issueByKey(key: string): Issue {
  const issue = createSeed().issues.find((i) => i.key === key);
  if (!issue) {
    throw new Error(`missing seed issue ${key}`);
  }
  return issue;
}

describe("totalDurationMs", () => {
  it("sums every step's duration", () => {
    expect(totalDurationMs(STEPS)).toBe(500);
  });

  it("is zero for an empty script", () => {
    expect(totalDurationMs([])).toBe(0);
  });
});

describe("createAgentRun", () => {
  it("builds a running run scripted for the issue", () => {
    const issue = issueByKey("SLOP-101");
    const run = createAgentRun(issue);
    expect(run.issueKey).toBe("SLOP-101");
    expect(run.status).toBe("running");
    expect(run.elapsedMs).toBe(0);
    expect(run.currentStep).toBe(0);
    // Script shape is analyse → type beats → ship; a story has 4 steps.
    expect(run.steps.length).toBeGreaterThanOrEqual(3);
    expect(run.steps[0].label).toBe("Analyzing requirements");
    expect(run.steps[run.steps.length - 1].label).toBe("Merging to main");
  });
});

describe("streamedPrefix", () => {
  it("reveals nothing at or before fraction 0", () => {
    expect(streamedPrefix("alpha beta", 0)).toBe("");
    expect(streamedPrefix("alpha beta", -1)).toBe("");
  });

  it("reveals the whole output at or beyond fraction 1", () => {
    expect(streamedPrefix("alpha beta", 1)).toBe("alpha beta");
    expect(streamedPrefix("alpha beta", 2)).toBe("alpha beta");
  });

  it("reveals the full output for an empty word list even mid-fraction", () => {
    // No words → nothing to reveal incrementally; returns the (empty) output.
    expect(streamedPrefix("", 0.5)).toBe("");
  });

  it("reveals words incrementally, preserving spacing", () => {
    // 3 words; ceil(0.34*3)=2 words → "alpha beta ".
    expect(streamedPrefix("alpha beta gamma", 0.34)).toBe("alpha beta ");
    // ceil(0.4*3)=2 as well.
    expect(streamedPrefix("alpha beta gamma", 0.4)).toBe("alpha beta ");
    // A small positive fraction reveals at least the first word.
    expect(streamedPrefix("alpha beta gamma", 0.01)).toBe("alpha ");
  });
});

describe("currentStepIndex", () => {
  it("is 0 before the first step ends", () => {
    expect(currentStepIndex(STEPS, 0)).toBe(0);
    expect(currentStepIndex(STEPS, 299)).toBe(0);
  });

  it("advances to the next step at the boundary", () => {
    expect(currentStepIndex(STEPS, 300)).toBe(1);
    expect(currentStepIndex(STEPS, 499)).toBe(1);
  });

  it("equals steps.length once every step is done", () => {
    expect(currentStepIndex(STEPS, 500)).toBe(2);
    expect(currentStepIndex(STEPS, 9999)).toBe(2);
  });
});

describe("stepViews", () => {
  it("marks the first step running and the rest pending at the start", () => {
    const views = stepViews(STEPS, 0);
    expect(views[0].state).toBe("running");
    expect(views[0].streamedOutput).toBe("");
    expect(views[1].state).toBe("pending");
    expect(views[1].streamedOutput).toBe("");
  });

  it("streams the running step's output partially", () => {
    // Halfway through step 0 (150/300): ceil(0.5*3)=2 words.
    const views = stepViews(STEPS, 150);
    expect(views[0].state).toBe("running");
    expect(views[0].streamedOutput).toBe("alpha beta ");
  });

  it("marks an elapsed step done with full output and the next running", () => {
    const views = stepViews(STEPS, 350);
    expect(views[0].state).toBe("done");
    expect(views[0].streamedOutput).toBe("alpha beta gamma");
    expect(views[1].state).toBe("running");
  });

  it("marks every step done once the total has elapsed", () => {
    const views = stepViews(STEPS, 500);
    expect(views.every((v) => v.state === "done")).toBe(true);
    expect(views[1].streamedOutput).toBe("one two");
  });

  it("treats only ONE step as running when two share a boundary instant", () => {
    // At exactly 300ms, step 0 is done (>= end) and step 1 begins running.
    const views = stepViews(STEPS, 300);
    expect(views[0].state).toBe("done");
    expect(views[1].state).toBe("running");
    expect(views.filter((v) => v.state === "running")).toHaveLength(1);
  });

  it("handles a zero-duration step as instantly fully streamed while active", () => {
    const zero: AgentStep[] = [
      { id: "z", label: "instant", output: "boom", durationMs: 0 },
      { id: "n", label: "next", output: "later", durationMs: 100 },
    ];
    // At elapsed 0, the zero-duration step's end (0) is reached, so it's done;
    // the next step begins running. This exercises the durationMs===0 guard via
    // the done branch.
    const views = stepViews(zero, 0);
    expect(views[0].state).toBe("done");
    expect(views[1].state).toBe("running");
  });
});

describe("advanceRun", () => {
  function run(): AgentRunState {
    return {
      issueKey: "SLOP-101",
      steps: STEPS,
      elapsedMs: 0,
      status: "running",
      currentStep: 0,
    };
  }

  it("accumulates elapsed time and recomputes currentStep", () => {
    const next = advanceRun(run(), 350);
    expect(next.elapsedMs).toBe(350);
    expect(next.status).toBe("running");
    expect(next.currentStep).toBe(1);
  });

  it("clamps elapsed to the total and flips to done on completion", () => {
    const next = advanceRun(run(), 10_000);
    expect(next.elapsedMs).toBe(500); // clamped to total
    expect(next.status).toBe("done");
    expect(next.currentStep).toBe(2);
  });

  it("returns the SAME reference for a non-positive delta", () => {
    const r = run();
    expect(advanceRun(r, 0)).toBe(r);
    expect(advanceRun(r, -5)).toBe(r);
  });

  it("returns the SAME reference when the run is not running", () => {
    const done: AgentRunState = { ...run(), status: "done" };
    expect(advanceRun(done, 100)).toBe(done);
    const cancelled: AgentRunState = { ...run(), status: "cancelled" };
    expect(advanceRun(cancelled, 100)).toBe(cancelled);
  });
});

describe("cancelRun", () => {
  it("freezes a running run as cancelled, keeping its elapsed", () => {
    const partial: AgentRunState = {
      issueKey: "SLOP-101",
      steps: STEPS,
      elapsedMs: 150,
      status: "running",
      currentStep: 0,
    };
    const cancelled = cancelRun(partial);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.elapsedMs).toBe(150);
  });

  it("returns the SAME reference for an already-terminal run", () => {
    const done: AgentRunState = {
      issueKey: "SLOP-101",
      steps: STEPS,
      elapsedMs: 500,
      status: "done",
      currentStep: 2,
    };
    expect(cancelRun(done)).toBe(done);
  });
});

describe("isRunFinished", () => {
  it("is false while running and true once terminal", () => {
    const base: AgentRunState = {
      issueKey: "SLOP-101",
      steps: STEPS,
      elapsedMs: 0,
      status: "running",
      currentStep: 0,
    };
    expect(isRunFinished(base)).toBe(false);
    expect(isRunFinished({ ...base, status: "done" })).toBe(true);
    expect(isRunFinished({ ...base, status: "cancelled" })).toBe(true);
  });
});
