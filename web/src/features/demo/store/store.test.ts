import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyAddComment,
  applyMoveIssue,
  applySetDescription,
  columnsFromIssues,
  selectAgentUser,
  selectColumns,
  selectIssueByKey,
  selectIssuesByStatus,
  selectSelectedIssue,
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

describe("applyMoveIssue (pure board-transition reducer)", () => {
  it("returns a new issues slice with the transitioned status + bumped clock", () => {
    const state = useDemoStore.getState();
    const todo = selectIssuesByStatus(state, "todo")[0];
    const result = applyMoveIssue(state, todo.key, "in_progress", () => 999);

    // A move yields a partial slice (not the same state reference).
    expect(result).not.toBe(state);
    const issues = (result as { issues: typeof state.issues }).issues;
    expect(issues).not.toBe(state.issues);
    const moved = issues.find((i) => i.key === todo.key);
    expect(moved?.status).toBe("in_progress");
    expect(moved?.updatedAt).toBe(999);
    // Other issues are preserved by identity (only the one was replaced).
    const other = issues.find((i) => i.key !== todo.key);
    const originalOther = state.issues.find((i) => i.key === other?.key);
    expect(other).toBe(originalOther);
  });

  it("is a no-op (same state reference) for an unknown key", () => {
    const state = useDemoStore.getState();
    expect(applyMoveIssue(state, "SLOP-999", "done", () => 1)).toBe(state);
  });

  it("is a no-op (same state reference) when the issue is already in the target column", () => {
    const state = useDemoStore.getState();
    const todo = selectIssuesByStatus(state, "todo")[0];
    expect(applyMoveIssue(state, todo.key, "todo", () => 1)).toBe(state);
  });
});

describe("moveIssue store action", () => {
  it("moves a To Do card to In Progress and updates both column counts live", () => {
    const before = selectStatusCounts(useDemoStore.getState());
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];

    useDemoStore.getState().moveIssue(todo.key, "in_progress", () => 42);

    const after = selectStatusCounts(useDemoStore.getState());
    expect(after.todo).toBe(before.todo - 1);
    expect(after.in_progress).toBe(before.in_progress + 1);
    const moved = selectIssueByKey(useDemoStore.getState(), todo.key);
    expect(moved?.status).toBe("in_progress");
    expect(moved?.updatedAt).toBe(42);
  });

  it("defaults to Date.now when no clock is injected", () => {
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];
    const before = Date.now();
    useDemoStore.getState().moveIssue(todo.key, "done");
    const after = Date.now();
    const moved = selectIssueByKey(useDemoStore.getState(), todo.key);
    expect(moved?.status).toBe("done");
    expect(moved?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(moved?.updatedAt).toBeLessThanOrEqual(after);
  });

  it("is a no-op for a same-column drop: no array swap, no subscriber notify", () => {
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];
    const issuesBefore = useDemoStore.getState().issues;
    const listener = vi.fn();
    const unsubscribe = useDemoStore.subscribe(listener);

    useDemoStore.getState().moveIssue(todo.key, "todo", () => 1);

    expect(useDemoStore.getState().issues).toBe(issuesBefore);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("is a no-op for an unknown key", () => {
    const issuesBefore = useDemoStore.getState().issues;
    const listener = vi.fn();
    const unsubscribe = useDemoStore.subscribe(listener);

    useDemoStore.getState().moveIssue("SLOP-000", "done", () => 1);

    expect(useDemoStore.getState().issues).toBe(issuesBefore);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("reset", () => {
  it("restores the seed exactly after mutations", () => {
    const target = useDemoStore.getState().issues[0];
    useDemoStore.getState().setIssueStatus(target.key, "done", () => 1);
    useDemoStore.getState().setSidebarCollapsed(true);
    useDemoStore.getState().openIssue(target.key);

    useDemoStore.getState().reset();

    const seed = createSeed();
    expect(useDemoStore.getState().issues).toEqual(seed.issues);
    expect(useDemoStore.getState().sidebarCollapsed).toBe(false);
    // The open issue is cleared too, so reset returns to the board view.
    expect(useDemoStore.getState().selectedIssueKey).toBeNull();
  });
});

describe("issue detail open/close (0006)", () => {
  it("starts with no issue selected", () => {
    expect(useDemoStore.getState().selectedIssueKey).toBeNull();
    expect(selectSelectedIssue(useDemoStore.getState())).toBeUndefined();
  });

  it("openIssue selects the key and selectSelectedIssue resolves the issue", () => {
    const target = useDemoStore.getState().issues[0];
    useDemoStore.getState().openIssue(target.key);
    expect(useDemoStore.getState().selectedIssueKey).toBe(target.key);
    expect(selectSelectedIssue(useDemoStore.getState())?.key).toBe(target.key);
  });

  it("selectSelectedIssue is undefined when the selected key resolves to no issue", () => {
    useDemoStore.getState().openIssue("SLOP-000");
    expect(useDemoStore.getState().selectedIssueKey).toBe("SLOP-000");
    expect(selectSelectedIssue(useDemoStore.getState())).toBeUndefined();
  });

  it("closeIssue clears the selection", () => {
    const target = useDemoStore.getState().issues[0];
    useDemoStore.getState().openIssue(target.key);
    useDemoStore.getState().closeIssue();
    expect(useDemoStore.getState().selectedIssueKey).toBeNull();
    expect(selectSelectedIssue(useDemoStore.getState())).toBeUndefined();
  });
});

describe("setStatus (issue-detail transition, 0006)", () => {
  it("transitions an issue so the board (column counts) reflects it — same path as a drag", () => {
    const before = selectStatusCounts(useDemoStore.getState());
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];

    useDemoStore.getState().setStatus(todo.key, "done", () => 5);

    const after = selectStatusCounts(useDemoStore.getState());
    expect(after.todo).toBe(before.todo - 1);
    expect(after.done).toBe(before.done + 1);
    const moved = selectIssueByKey(useDemoStore.getState(), todo.key);
    expect(moved?.status).toBe("done");
    expect(moved?.updatedAt).toBe(5);
  });

  it("defaults to Date.now when no clock is injected", () => {
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];
    const before = Date.now();
    useDemoStore.getState().setStatus(todo.key, "in_review");
    const after = Date.now();
    const moved = selectIssueByKey(useDemoStore.getState(), todo.key);
    expect(moved?.status).toBe("in_review");
    expect(moved?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(moved?.updatedAt).toBeLessThanOrEqual(after);
  });

  it("is a no-op (no notify) for a same-status change", () => {
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];
    const issuesBefore = useDemoStore.getState().issues;
    const listener = vi.fn();
    const unsubscribe = useDemoStore.subscribe(listener);

    useDemoStore.getState().setStatus(todo.key, "todo", () => 1);

    expect(useDemoStore.getState().issues).toBe(issuesBefore);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("applySetDescription (pure description reducer, 0006)", () => {
  it("updates the description and bumps updatedAt via the injected clock", () => {
    const state = useDemoStore.getState();
    const target = state.issues[0];
    const result = applySetDescription(state, target.key, "Rewritten", () => 8);

    expect(result).not.toBe(state);
    const issues = (result as { issues: typeof state.issues }).issues;
    const updated = issues.find((i) => i.key === target.key);
    expect(updated?.description).toBe("Rewritten");
    expect(updated?.updatedAt).toBe(8);
  });

  it("is a no-op (same reference) for an unknown key", () => {
    const state = useDemoStore.getState();
    expect(applySetDescription(state, "SLOP-000", "x", () => 1)).toBe(state);
  });

  it("is a no-op (same reference) when the description is unchanged", () => {
    const state = useDemoStore.getState();
    const target = state.issues[0];
    expect(
      applySetDescription(state, target.key, target.description, () => 1),
    ).toBe(state);
  });
});

describe("setDescription store action (0006)", () => {
  it("persists an edited description for the issue", () => {
    const target = useDemoStore.getState().issues[0];
    useDemoStore.getState().setDescription(target.key, "New text", () => 3);
    const updated = selectIssueByKey(useDemoStore.getState(), target.key);
    expect(updated?.description).toBe("New text");
    expect(updated?.updatedAt).toBe(3);
  });

  it("defaults to Date.now when no clock is injected", () => {
    const target = useDemoStore.getState().issues[0];
    const before = Date.now();
    useDemoStore.getState().setDescription(target.key, "Edited later");
    const after = Date.now();
    const updated = selectIssueByKey(useDemoStore.getState(), target.key);
    expect(updated?.description).toBe("Edited later");
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(updated?.updatedAt).toBeLessThanOrEqual(after);
  });
});

describe("applyAddComment (pure comment reducer, 0006)", () => {
  it("prepends a comment authored by the given user with a clock-derived id/createdAt", () => {
    const state = useDemoStore.getState();
    const target = state.issues[0];
    const author = state.users[1];
    const existing = target.comments.length;

    const result = applyAddComment(
      state,
      target.key,
      "  Looks great  ",
      author,
      () => 100,
    );

    expect(result).not.toBe(state);
    const issues = (result as { issues: typeof state.issues }).issues;
    const updated = issues.find((i) => i.key === target.key);
    expect(updated?.comments).toHaveLength(existing + 1);
    // Prepended at index 0, body trimmed, author + deterministic id/createdAt.
    const added = updated?.comments[0];
    expect(added?.body).toBe("Looks great");
    expect(added?.author).toBe(author);
    expect(added?.createdAt).toBe(100);
    // Deterministic, per-issue-unique id: prefix + monotonic seq + clock.
    expect(added?.id).toBe(`uc-${target.key}-1-100`);
    expect(updated?.updatedAt).toBe(100);
  });

  it("gives every comment a DISTINCT id even under the SAME fixed clock", () => {
    // Regression guard: ids must not collide when two comments share a timestamp
    // (ActivityFeed keys its list on comment.id). Add three comments to the same
    // issue with one fixed clock and assert all ids are unique.
    let state = useDemoStore.getState();
    const target = state.issues[0];
    for (const body of ["first", "second", "third"]) {
      const result = applyAddComment(
        state,
        target.key,
        body,
        target.reporter,
        () => 100,
      );
      // Fold the partial slice back into a working state for the next iteration.
      state = {
        ...state,
        issues: (result as { issues: typeof state.issues }).issues,
      };
    }
    const updated = state.issues.find((i) => i.key === target.key)!;
    const userComments = updated.comments.filter((c) =>
      c.id.startsWith(`uc-${target.key}-`),
    );
    expect(userComments).toHaveLength(3);
    const ids = userComments.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("is a no-op (same reference) for a blank / whitespace-only body", () => {
    const state = useDemoStore.getState();
    const target = state.issues[0];
    expect(
      applyAddComment(state, target.key, "   ", state.users[0], () => 1),
    ).toBe(state);
  });

  it("is a no-op (same reference) for an unknown key", () => {
    const state = useDemoStore.getState();
    expect(
      applyAddComment(state, "SLOP-000", "hi", state.users[0], () => 1),
    ).toBe(state);
  });
});

describe("addComment store action (0006)", () => {
  it("prepends a comment attributed to a non-agent teammate and orders newest-first", () => {
    const target = useDemoStore
      .getState()
      .issues.find((i) => i.comments.length > 0)!;
    const firstExisting = target.comments[0];

    useDemoStore.getState().addComment(target.key, "Fresh take", () => 200);

    const updated = selectIssueByKey(useDemoStore.getState(), target.key)!;
    // Newest-first: the new comment is index 0, the previously-newest is index 1.
    expect(updated.comments[0].body).toBe("Fresh take");
    expect(updated.comments[0].author.isAgent).toBeFalsy();
    expect(updated.comments[1]).toEqual(firstExisting);
  });

  it("ignores a blank submission (no churn, no notify)", () => {
    const target = useDemoStore.getState().issues[0];
    const issuesBefore = useDemoStore.getState().issues;
    const listener = vi.fn();
    const unsubscribe = useDemoStore.subscribe(listener);

    useDemoStore.getState().addComment(target.key, "   ", () => 1);

    expect(useDemoStore.getState().issues).toBe(issuesBefore);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("defaults to Date.now when no clock is injected", () => {
    const target = useDemoStore.getState().issues[0];
    const before = Date.now();
    useDemoStore.getState().addComment(target.key, "timed");
    const after = Date.now();
    const added = selectIssueByKey(useDemoStore.getState(), target.key)
      ?.comments[0];
    expect(added?.body).toBe("timed");
    expect(added?.createdAt).toBeGreaterThanOrEqual(before);
    expect(added?.createdAt).toBeLessThanOrEqual(after);
  });

  it("falls back to the first user when no non-agent teammate exists", () => {
    // Drive currentUser's fallback branch: replace users with an agent-only set,
    // then add a comment and assert it is attributed to that (only) user.
    const onlyAgent = useDemoStore.getState().users.find((u) => u.isAgent)!;
    useDemoStore.setState({ users: [onlyAgent] });
    const target = useDemoStore.getState().issues[0];

    useDemoStore.getState().addComment(target.key, "agent-only world", () => 9);

    const added = selectIssueByKey(useDemoStore.getState(), target.key)
      ?.comments[0];
    expect(added?.author).toEqual(onlyAgent);
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

  it("columnsFromIssues derives the ordered columns from a bare issues array", () => {
    const { issues } = useDemoStore.getState();
    const columns = columnsFromIssues(issues);
    expect(columns.map((c) => c.status)).toEqual([...STATUS_ORDER]);
    const total = columns.reduce((sum, c) => sum + c.issues.length, 0);
    expect(total).toBe(issues.length);
    // selectColumns delegates to columnsFromIssues → identical shape.
    expect(columns).toEqual(selectColumns(useDemoStore.getState()));
  });
});
