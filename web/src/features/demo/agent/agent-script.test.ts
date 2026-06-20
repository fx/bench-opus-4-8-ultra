import { describe, it, expect } from "vitest";
import { agentRunSummary, buildAgentScript } from "./agent-script.ts";
import type { Issue, IssueType } from "../data/types.ts";

// A minimal issue factory; only the fields the script reads (key, type, summary)
// matter, so the rest are stubbed.
function makeIssue(type: IssueType, key = "SLOP-900"): Issue {
  return {
    key,
    type,
    summary: `summary of ${key}`,
    description: "desc",
    status: "todo",
    priority: "medium",
    storyPoints: 3,
    assignee: null,
    reporter: {
      id: "r",
      name: "Reporter",
      initials: "RP",
      avatarColor: "#0052CC",
    },
    labels: [],
    comments: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

const ALL_TYPES: IssueType[] = ["story", "task", "bug", "epic", "subtask"];

describe("buildAgentScript", () => {
  it.each(ALL_TYPES)(
    "produces an analyse→type→ship script with unique ids for a %s",
    (type) => {
      const steps = buildAgentScript(makeIssue(type));
      // Always opens with analyse and ends with the ship step.
      expect(steps[0].label).toBe("Analyzing requirements");
      expect(steps[steps.length - 1].label).toBe("Merging to main");
      // At least analyse + one type beat + ship.
      expect(steps.length).toBeGreaterThanOrEqual(3);
      // Ids are unique (the panel uses them as React keys).
      const ids = steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      // Ids are scoped to the issue key.
      expect(ids.every((id) => id.includes("SLOP-900"))).toBe(true);
      // Every step has a positive (or zero) duration and non-empty output.
      for (const step of steps) {
        expect(step.durationMs).toBeGreaterThan(0);
        expect(step.output.length).toBeGreaterThan(0);
      }
    },
  );

  it("folds the issue key into the analyse step output", () => {
    const steps = buildAgentScript(makeIssue("task", "SLOP-123"));
    expect(steps[0].output).toContain("SLOP-123");
  });

  it("is deterministic for the same issue", () => {
    const a = buildAgentScript(makeIssue("bug"));
    const b = buildAgentScript(makeIssue("bug"));
    expect(a).toEqual(b);
  });

  it("varies the middle beats by issue type", () => {
    const story = buildAgentScript(makeIssue("story")).map((s) => s.label);
    const bug = buildAgentScript(makeIssue("bug")).map((s) => s.label);
    expect(story).not.toEqual(bug);
  });
});

describe("agentRunSummary", () => {
  it("references the issue key and is deterministic", () => {
    const issue = makeIssue("story", "SLOP-777");
    expect(agentRunSummary(issue)).toContain("SLOP-777");
    expect(agentRunSummary(issue)).toBe(agentRunSummary(issue));
  });
});
