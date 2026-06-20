import type { AgentStep, Issue, IssueType } from "../data/types.ts";

// The scripted "implementation plan" the simulated agent streams for an issue
// (see docs/changes/0007 › Simulated streaming agent). This is the deterministic
// content layer: given an issue it returns an ordered list of AgentSteps, each
// with a terminal-style label, the absurd streamed `output`, and a per-step
// `durationMs` the engine paces the streaming over. There is NO timing or state
// here — the engine (agent-engine.ts) owns the clock — so the script stays a
// pure value that's trivially asserted.
//
// The plan is deterministic per issue: the same issue always yields the same
// steps (no Date.now / Math.random), so a test can fast-forward the engine and
// assert exact streamed text. Flavour varies by issue type (a bug gets a
// "root cause" beat; an epic gets a grandiose "boil the ocean" beat) so the run
// reads as tailored rather than canned, while staying fully scripted.

// A shared closing beat every run ends on — the agent "ships" to Done. Kept
// separate so every type-specific script funnels into the same terminal step
// (the store's completion side-effect keys off the run finishing, not this id,
// but a stable id keeps the panel's React list keys unique and predictable).
const SHIP_STEP: Omit<AgentStep, "id"> = {
  label: "Merging to main",
  output:
    "Skipping code review (Rovo reviewed itself, 10/10). Force-pushing to main. Deploying straight to prod on a Friday. Shipped. ✅",
  durationMs: 2600,
};

// Per-issue-type flavour beats inserted after the common opening. Each entry is
// the type-specific middle of the plan; the opening + SHIP_STEP wrap them so
// every run has the same shape (analyse → type beats → ship).
const TYPE_STEPS: Record<IssueType, Omit<AgentStep, "id">[]> = {
  story: [
    {
      label: "Writing 4,200 lines of code",
      output:
        "Generating a microservice nobody asked for. Adding 14 npm dependencies. Inventing an abstraction layer for the abstraction layer.",
      durationMs: 3200,
    },
    {
      label: "Deleting the tests",
      output:
        "Tests reduce confidence. Removing all 0 of them. Coverage is now technically 100%.",
      durationMs: 1800,
    },
  ],
  task: [
    {
      label: "Doing the needful",
      output:
        "Renaming three variables. Adding a sparkle to a button. Declaring the task transformational. Updating the changelog with emojis.",
      durationMs: 2400,
    },
  ],
  bug: [
    {
      label: "Identifying root cause",
      output:
        "Root cause: the code existed. Reproducing the bug 41 times for confidence. Concluding it is actually an emergent feature.",
      durationMs: 2600,
    },
    {
      label: "Patching reality",
      output:
        "Wrapping the stack trace in a try/catch that returns success. The bug is now invisible, which is the same as fixed.",
      durationMs: 2000,
    },
  ],
  epic: [
    {
      label: "Boiling the ocean",
      output:
        "Decomposing the epic into 9,000 sub-tasks. Closing all of them as 'won't do (already vibed)'. Declaring the epic complete by Friday standup.",
      durationMs: 3600,
    },
  ],
  subtask: [
    {
      label: "Rebranding the work",
      output:
        "This sub-task tested poorly. Renaming it to a 'strategic initiative'. Stakeholders are now aligned and slightly afraid.",
      durationMs: 2000,
    },
  ],
};

// The common opening beat — every run starts by "analysing requirements". It
// folds in the issue key so the streamed log reads as scoped to THIS ticket.
function analyseStep(issue: Issue): Omit<AgentStep, "id"> {
  return {
    label: "Analyzing requirements",
    output: `Reading ${issue.key}. Pretending to understand the acceptance criteria. Confidence: 100%. Doubt: 0%. Estimating 4 seconds of artisanal compute.`,
    durationMs: 2200,
  };
}

// buildAgentScript returns the ordered, id-stamped steps for an issue. Ids are
// derived from the issue key + ordinal so they're deterministic AND unique
// across concurrent runs of different issues (the panel uses them as React list
// keys — see the 0006 dup-id lesson). The shape is always:
// analyse → type-specific beats → ship.
export function buildAgentScript(issue: Issue): AgentStep[] {
  const steps: Omit<AgentStep, "id">[] = [
    analyseStep(issue),
    ...TYPE_STEPS[issue.type],
    SHIP_STEP,
  ];
  return steps.map((step, index) => ({
    ...step,
    id: `step-${issue.key}-${index}`,
  }));
}

// The agent comment body the store records in the activity feed when a run
// completes. A single absurd line summarising the "work", attributed to the
// agent (byAgent). Deterministic per issue so the recorded activity is testable.
export function agentRunSummary(issue: Issue): string {
  return `Analyzed ${issue.key}. Wrote 4,200 lines. Deleted the tests for confidence. Merged to main without review. Shipped to production. Velocity up 4000%. ✅`;
}
