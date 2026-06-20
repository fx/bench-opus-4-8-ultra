import { describe, it, expect } from "vitest";
import { STATUS_LABELS, STATUS_ORDER, type Status } from "./types.ts";

describe("status ordering and labels", () => {
  it("orders the four board columns To Do → In Progress → In Review → Done", () => {
    expect(STATUS_ORDER).toEqual([
      "todo",
      "in_progress",
      "in_review",
      "done",
    ] satisfies Status[]);
  });

  it("labels every status with its Jira column title", () => {
    expect(STATUS_LABELS.todo).toBe("To Do");
    expect(STATUS_LABELS.in_progress).toBe("In Progress");
    expect(STATUS_LABELS.in_review).toBe("In Review");
    expect(STATUS_LABELS.done).toBe("Done");
  });

  it("has a label for every ordered status", () => {
    for (const status of STATUS_ORDER) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
