import { describe, it, expect } from "vitest";
import {
  AUTOPILOT_BASE_INTERVAL_MS,
  jitteredInterval,
  nextStatus,
  pickAutopilotTarget,
  seededJitter,
} from "./autopilot.ts";
import type { Issue, Status } from "../data/types.ts";

function makeIssue(key: string, status: Status): Issue {
  return {
    key,
    type: "task",
    summary: key,
    description: "",
    status,
    priority: "medium",
    storyPoints: null,
    assignee: null,
    reporter: { id: "r", name: "R", initials: "R", avatarColor: "#0052CC" },
    labels: [],
    comments: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("nextStatus", () => {
  it("steps one column toward Done", () => {
    expect(nextStatus("todo")).toBe("in_progress");
    expect(nextStatus("in_progress")).toBe("in_review");
    expect(nextStatus("in_review")).toBe("done");
  });

  it("returns null for Done (nothing further)", () => {
    expect(nextStatus("done")).toBeNull();
  });

  it("returns null for an unknown status (defensive)", () => {
    expect(nextStatus("nope" as Status)).toBeNull();
  });
});

describe("seededJitter", () => {
  it("is deterministic and within [0,1)", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const j = seededJitter(seed);
      expect(j).toBeGreaterThanOrEqual(0);
      expect(j).toBeLessThan(1);
      expect(j).toBe(seededJitter(seed));
    }
  });

  it("varies across seeds", () => {
    expect(seededJitter(0)).not.toBe(seededJitter(1));
  });
});

describe("jitteredInterval", () => {
  it("stays within [50%, 150%) of the base interval", () => {
    for (let n = 0; n < 50; n += 1) {
      const interval = jitteredInterval(n);
      expect(interval).toBeGreaterThanOrEqual(AUTOPILOT_BASE_INTERVAL_MS * 0.5);
      expect(interval).toBeLessThan(AUTOPILOT_BASE_INTERVAL_MS * 1.5);
    }
  });

  it("is deterministic per move ordinal", () => {
    expect(jitteredInterval(3)).toBe(jitteredInterval(3));
  });
});

describe("pickAutopilotTarget", () => {
  it("picks the first not-Done issue and its next status (seed order)", () => {
    const issues = [
      makeIssue("A", "done"),
      makeIssue("B", "in_progress"),
      makeIssue("C", "todo"),
    ];
    expect(pickAutopilotTarget(issues)).toEqual({
      key: "B",
      status: "in_review",
    });
  });

  it("returns null when every issue is Done", () => {
    const issues = [makeIssue("A", "done"), makeIssue("B", "done")];
    expect(pickAutopilotTarget(issues)).toBeNull();
  });

  it("returns null for an empty board", () => {
    expect(pickAutopilotTarget([])).toBeNull();
  });

  it("skips the excluded key (an issue with an active manual agent run)", () => {
    const issues = [makeIssue("A", "todo"), makeIssue("B", "todo")];
    // Excluding A makes B the first eligible target.
    expect(pickAutopilotTarget(issues, "A")).toEqual({
      key: "B",
      status: "in_progress",
    });
  });

  it("returns null when only the excluded issue remains movable", () => {
    const issues = [makeIssue("A", "done"), makeIssue("B", "todo")];
    // B is the only not-Done issue, but it's excluded → nothing to ship.
    expect(pickAutopilotTarget(issues, "B")).toBeNull();
  });
});
