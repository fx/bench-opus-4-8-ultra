import { create } from "zustand";
import { createSeed } from "../data/seed.ts";
import {
  STATUS_ORDER,
  type Issue,
  type Project,
  type Status,
  type User,
} from "../data/types.ts";

// The demo's client-side state store (see docs/changes/0004 › State store). It
// holds all issues/users/project from the deterministic seed and exposes
// selectors plus a `reset()` that restores the seed exactly. Board- and
// agent-mutating actions (`setIssueStatus`, sidebar collapse) live here so the
// shell is self-contained; the richer board/agent behaviour wired in 0005–0007
// builds on these primitives.

export interface DemoState {
  project: Project;
  users: User[];
  issues: Issue[];
  // Sidebar collapse is demo UI state; kept in the store (rather than local
  // component state) so later views can react to it and tests can drive it
  // directly. Persistence is in-memory only (per change 0004 open question).
  sidebarCollapsed: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Move an issue to a new status (board drag / detail-view transition). A no-op
  // for unknown keys so callers never need to guard. `updatedAt` is bumped via
  // the injectable `now` so tests stay deterministic.
  setIssueStatus: (key: string, status: Status, now?: () => number) => void;
  // Board drag-and-drop transition (0005). Semantically a status change, but
  // separated from `setIssueStatus` so the board's dnd wiring has a named,
  // intention-revealing action and the pure transition reducer
  // (`applyMoveIssue`) can be unit-tested directly. Both a same-column drop and
  // an unknown key are no-ops (the SAME state reference, so subscribers aren't
  // notified and counts don't churn).
  moveIssue: (key: string, status: Status, now?: () => number) => void;
  // Restore the canonical seed, discarding all mutations. Sidebar collapse is
  // reset too so the demo returns to a pristine initial state.
  reset: () => void;
}

// applyMoveIssue is the PURE board-transition reducer, kept out of the store
// closure (and out of the dnd handler) so it is unit-testable in isolation per
// the change-0005 design ("transition logic in the store, not the dnd handler").
// It returns a partial state slice to merge, or the SAME `state` reference for a
// no-op so Zustand bails out without notifying subscribers. A move is a no-op
// when the key is unknown OR the issue is already in the target column — both
// must avoid churning the issues array (and therefore the live column counts).
export function applyMoveIssue(
  state: DemoState,
  key: string,
  status: Status,
  now: () => number,
): DemoState | Pick<DemoState, "issues"> {
  const index = state.issues.findIndex((issue) => issue.key === key);
  // Unknown key, or already in the target column → no-op (same reference).
  if (index === -1 || state.issues[index].status === status) {
    return state;
  }
  const issues = state.issues.slice();
  issues[index] = { ...issues[index], status, updatedAt: now() };
  return { issues };
}

export const useDemoStore = create<DemoState>((set) => ({
  ...createSeed(),
  sidebarCollapsed: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setIssueStatus: (key, status, now = Date.now) =>
    set((state) => {
      // True no-op for an unknown key: return the SAME state reference so
      // Zustand skips the update and does not notify subscribers (no needless
      // re-renders). Only allocate a new issues array when a match is updated.
      const index = state.issues.findIndex((issue) => issue.key === key);
      if (index === -1) {
        return state;
      }
      const issues = state.issues.slice();
      issues[index] = { ...issues[index], status, updatedAt: now() };
      return { issues };
    }),

  moveIssue: (key, status, now = Date.now) =>
    set((state) => applyMoveIssue(state, key, status, now)),

  reset: () => set({ ...createSeed(), sidebarCollapsed: false }),
}));

// ── Selectors ─────────────────────────────────────────────────────────────--
// Pure helpers over DemoState. Kept as free functions (not store methods) so
// they can be unit-tested in isolation and composed by components without
// re-rendering on unrelated state.

// All issues in a given status (column), preserving seed order.
export function selectIssuesByStatus(
  state: DemoState,
  status: Status,
): Issue[] {
  return state.issues.filter((issue) => issue.status === status);
}

// Issue count per status, with every column present (zero when empty) and in
// board display order — what column headers render.
export function selectStatusCounts(state: DemoState): Record<Status, number> {
  // `satisfies` (not `as`) so TypeScript verifies every Status key is present
  // and none are extra — if the Status union changes, this fails to compile
  // instead of silently producing a partial/incorrect counts object.
  const counts = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  } satisfies Record<Status, number>;
  for (const issue of state.issues) {
    counts[issue.status] += 1;
  }
  return counts;
}

// Look up a single issue by key (issue detail view), or undefined if missing.
export function selectIssueByKey(
  state: DemoState,
  key: string,
): Issue | undefined {
  return state.issues.find((issue) => issue.key === key);
}

// The agent user ("Rovo Ultra"), or undefined if absent — used by agent-handled
// UI to render the glowing avatar.
export function selectAgentUser(state: DemoState): User | undefined {
  return state.users.find((user) => user.isAgent);
}

// Total issue count across all columns (sidebar/board summary).
export function selectTotalIssues(state: DemoState): number {
  return state.issues.length;
}

// A single board column: a status and the issues currently in it.
export interface BoardColumn {
  status: Status;
  issues: Issue[];
}

// The board columns in display order, derived purely from an issues array. The
// Board subscribes to `state.issues` (a stable reference) and memoises this, so
// it never feeds a freshly-built object back into Zustand's equality check (which
// would loop). Kept independent of DemoState so it composes from any issue list.
export function columnsFromIssues(issues: Issue[]): BoardColumn[] {
  return STATUS_ORDER.map((status) => ({
    status,
    issues: issues.filter((issue) => issue.status === status),
  }));
}

// The board columns in display order paired with their issues — a convenience
// composing STATUS_ORDER with the issue list for the board/sidebar.
export function selectColumns(state: DemoState): BoardColumn[] {
  return columnsFromIssues(state.issues);
}
