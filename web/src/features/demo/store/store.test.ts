import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  selectAgentUser,
  selectColumns,
  selectIssueByKey,
  selectIssuesByStatus,
  selectStatusCounts,
  selectTotalIssues,
  useDemoStore,
} from "./store.ts";
import { createSeed } from "../data/seed.ts";
import { STATUS_ORDER } from "../data/types.ts";

// The store is a singleton; reset to the seed before each test so cases never
// leak mutations into one another.
beforeEach(() => {
  useDemoStore.getState().reset();
});

describe("useDemoStore initial state", () => {
  it("initialises from the deterministic seed", () => {
    const state = useDemoStore.getState();
    const seed = createSeed();
    expect(state.issues).toEqual(seed.issues);
    expect(state.users).toEqual(seed.users);
    expect(state.project).toEqual(seed.project);
  });

  it("starts with the sidebar expanded", () => {
    expect(useDemoStore.getState().sidebarCollapsed).toBe(false);
  });
});

describe("sidebar actions", () => {
  it("toggleSidebar flips the collapsed flag", () => {
    const { toggleSidebar } = useDemoStore.getState();
    toggleSidebar();
    expect(useDemoStore.getState().sidebarCollapsed).toBe(true);
    useDemoStore.getState().toggleSidebar();
    expect(useDemoStore.getState().sidebarCollapsed).toBe(false);
  });

  it("setSidebarCollapsed sets an explicit value", () => {
    useDemoStore.getState().setSidebarCollapsed(true);
    expect(useDemoStore.getState().sidebarCollapsed).toBe(true);
    useDemoStore.getState().setSidebarCollapsed(false);
    expect(useDemoStore.getState().sidebarCollapsed).toBe(false);
  });
});

describe("setIssueStatus", () => {
  it("moves an issue to a new status and bumps updatedAt via the injected clock", () => {
    const target = useDemoStore.getState().issues[0];
    const newStatus = target.status === "done" ? "todo" : "done";
    useDemoStore.getState().setIssueStatus(target.key, newStatus, () => 12345);
    const updated = useDemoStore
      .getState()
      .issues.find((i) => i.key === target.key);
    expect(updated?.status).toBe(newStatus);
    expect(updated?.updatedAt).toBe(12345);
  });

  it("defaults to Date.now when no clock is injected", () => {
    const target = useDemoStore.getState().issues[0];
    const before = Date.now();
    useDemoStore.getState().setIssueStatus(target.key, "in_review");
    const after = Date.now();
    const updated = useDemoStore
      .getState()
      .issues.find((i) => i.key === target.key);
    expect(updated?.status).toBe("in_review");
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(updated?.updatedAt).toBeLessThanOrEqual(after);
  });

  it("leaves other issues untouched", () => {
    const [first, second] = useDemoStore.getState().issues;
    useDemoStore.getState().setIssueStatus(first.key, "done", () => 1);
    const unchanged = useDemoStore
      .getState()
      .issues.find((i) => i.key === second.key);
    expect(unchanged).toEqual(second);
  });

  it("is a true no-op for an unknown key — same state reference, no notification", () => {
    const stateBefore = useDemoStore.getState();
    const issuesBefore = stateBefore.issues;
    const listener = vi.fn();
    const unsubscribe = useDemoStore.subscribe(listener);

    useDemoStore.getState().setIssueStatus("SLOP-999", "done", () => 1);

    // No update: the issues array keeps the same reference and no subscriber
    // is notified (Zustand bails when the reducer returns the same state).
    expect(useDemoStore.getState().issues).toBe(issuesBefore);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("notifies subscribers and swaps the issues array for a known key", () => {
    const target = useDemoStore.getState().issues[0];
    const issuesBefore = useDemoStore.getState().issues;
    const listener = vi.fn();
    const unsubscribe = useDemoStore.subscribe(listener);

    useDemoStore.getState().setIssueStatus(target.key, "in_review", () => 7);

    // A real update: new array reference, listener fired, status transitioned.
    expect(useDemoStore.getState().issues).not.toBe(issuesBefore);
    expect(listener).toHaveBeenCalledTimes(1);
    const updated = useDemoStore
      .getState()
      .issues.find((i) => i.key === target.key);
    expect(updated?.status).toBe("in_review");
    expect(updated?.updatedAt).toBe(7);
    unsubscribe();
  });
});

describe("reset", () => {
  it("restores the seed exactly after mutations", () => {
    const target = useDemoStore.getState().issues[0];
    useDemoStore.getState().setIssueStatus(target.key, "done", () => 1);
    useDemoStore.getState().setSidebarCollapsed(true);

    useDemoStore.getState().reset();

    const seed = createSeed();
    expect(useDemoStore.getState().issues).toEqual(seed.issues);
    expect(useDemoStore.getState().sidebarCollapsed).toBe(false);
  });
});

describe("selectors", () => {
  it("selectIssuesByStatus returns only that column's issues in order", () => {
    const state = useDemoStore.getState();
    const todo = selectIssuesByStatus(state, "todo");
    expect(todo.length).toBeGreaterThan(0);
    expect(todo.every((i) => i.status === "todo")).toBe(true);
  });

  it("selectStatusCounts counts every column, including zeros", () => {
    const state = useDemoStore.getState();
    const counts = selectStatusCounts(state);
    const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0);
    expect(total).toBe(state.issues.length);
    for (const status of STATUS_ORDER) {
      expect(counts[status]).toBe(
        state.issues.filter((i) => i.status === status).length,
      );
    }
  });

  it("selectStatusCounts reports zero for an emptied column", () => {
    // Move every In Review issue out, then assert the column reads zero.
    const state = useDemoStore.getState();
    for (const issue of selectIssuesByStatus(state, "in_review")) {
      useDemoStore.getState().setIssueStatus(issue.key, "done", () => 1);
    }
    expect(selectStatusCounts(useDemoStore.getState()).in_review).toBe(0);
  });

  it("selectIssueByKey finds an issue, or undefined when missing", () => {
    const state = useDemoStore.getState();
    const first = state.issues[0];
    expect(selectIssueByKey(state, first.key)).toEqual(first);
    expect(selectIssueByKey(state, "SLOP-000")).toBeUndefined();
  });

  it("selectAgentUser returns the Rovo Ultra agent", () => {
    const agent = selectAgentUser(useDemoStore.getState());
    expect(agent?.isAgent).toBe(true);
    expect(agent?.name).toBe("Rovo Ultra");
  });

  it("selectAgentUser returns undefined when no agent user exists", () => {
    // Drive the no-agent branch with a synthetic state slice.
    const state = useDemoStore.getState();
    const withoutAgent = {
      ...state,
      users: state.users.filter((u) => !u.isAgent),
    };
    expect(selectAgentUser(withoutAgent)).toBeUndefined();
  });

  it("selectTotalIssues returns the full issue count", () => {
    const state = useDemoStore.getState();
    expect(selectTotalIssues(state)).toBe(state.issues.length);
  });

  it("selectColumns pairs each ordered status with its issues", () => {
    const state = useDemoStore.getState();
    const columns = selectColumns(state);
    expect(columns.map((c) => c.status)).toEqual([...STATUS_ORDER]);
    for (const column of columns) {
      expect(column.issues.every((i) => i.status === column.status)).toBe(true);
    }
    const total = columns.reduce((sum, c) => sum + c.issues.length, 0);
    expect(total).toBe(state.issues.length);
  });
});
