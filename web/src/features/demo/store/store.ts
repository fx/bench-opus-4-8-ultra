import { create } from "zustand";
import { createSeed } from "../data/seed.ts";
import {
  STATUS_ORDER,
  type Comment,
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
  // The key of the issue whose detail view is open (0006), or null when the
  // board is showing. Kept in the store (not local component state) so a card
  // click, the detail modal, and any future deep-link all read/write one source
  // of truth, and so closing/reset returns to the board deterministically.
  selectedIssueKey: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Open the issue detail view for `key` (0006). Stored verbatim; an unknown key
  // simply yields a detail view that resolves no issue (the modal guards on a
  // missing issue), so callers never need to pre-validate.
  openIssue: (key: string) => void;
  // Close the issue detail view, returning to the board.
  closeIssue: () => void;
  // Issue-detail status transition (0006). A thin alias over the SAME pure
  // transition reducer the board's drag uses (`applyMoveIssue`), so the status
  // dropdown and a drag are literally one code path — the board reflects a
  // detail-view change with zero drift. No-op (same reference) for an unknown
  // key or a same-column transition.
  setStatus: (key: string, status: Status, now?: () => number) => void;
  // Update an issue's description (0006 inline edit). A no-op (same reference)
  // for an unknown key OR when the description is unchanged, so a Save that
  // didn't alter the text doesn't churn the issues array. Bumps `updatedAt` via
  // the injectable clock when it does change.
  setDescription: (
    key: string,
    description: string,
    now?: () => number,
  ) => void;
  // Append a (mock) comment authored by the current user (0006). Prepends to the
  // issue's `comments` so the activity feed — which renders reverse-chronological
  // — shows it at the top, and bumps `updatedAt`. A blank/whitespace-only body or
  // an unknown key is a no-op (same reference). `now` is injectable for
  // deterministic timestamp + ordering tests; `id` is derived from the clock so
  // it stays deterministic too.
  addComment: (key: string, body: string, now?: () => number) => void;
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

// applySetDescription is the PURE description-edit reducer. Returns a partial
// `issues` slice or the SAME `state` reference for a no-op — an unknown key, or a
// description identical to the current one (an inline-edit Save that didn't change
// the text), both avoid churning the issues array / bumping updatedAt.
export function applySetDescription(
  state: DemoState,
  key: string,
  description: string,
  now: () => number,
): DemoState | Pick<DemoState, "issues"> {
  const index = state.issues.findIndex((issue) => issue.key === key);
  if (index === -1 || state.issues[index].description === description) {
    return state;
  }
  const issues = state.issues.slice();
  issues[index] = { ...issues[index], description, updatedAt: now() };
  return { issues };
}

// applyAddComment is the PURE comment reducer, kept beside applyMoveIssue and out
// of the store closure so the "prepend + ordering + author + timestamp" logic is
// unit-testable in isolation. Like applyMoveIssue it returns either a partial
// `issues` slice to merge or the SAME `state` reference for a no-op (unknown key
// or empty body) so Zustand bails without notifying subscribers. The comment is
// PREPENDED — the activity feed renders newest-first, so a fresh comment lands at
// the top — and authored by `author` with a deterministic id + clock-derived
// createdAt so the result is fully deterministic under an injected clock. The id
// folds in a per-issue monotonic sequence (derived below) ALONGSIDE the clock, so
// two comments added in the same millisecond — or any test using one fixed clock
// for multiple submissions — still get DISTINCT ids (the activity feed uses
// `comment.id` as its React list key, so a collision would break rendering).
export function applyAddComment(
  state: DemoState,
  key: string,
  body: string,
  author: User,
  now: () => number,
): DemoState | Pick<DemoState, "issues"> {
  // Ignore blank / whitespace-only bodies — the composer must not add an empty
  // comment. Trimmed so a body of spaces is treated as empty, and the stored
  // body is the trimmed text (no leading/trailing whitespace).
  const trimmed = body.trim();
  if (trimmed === "") {
    return state;
  }
  const index = state.issues.findIndex((issue) => issue.key === key);
  if (index === -1) {
    return state;
  }
  const issues = state.issues.slice();
  const issue = issues[index];
  const at = now();
  // A per-issue monotonic sequence: count how many user-added comments this
  // issue already has (ids prefixed `uc-${key}-`) and use the next ordinal. This
  // never repeats for a given issue even under a fixed clock, and is independent
  // of the timestamp, so same-millisecond adds stay unique. Seed comment ids use
  // a different prefix, so they never clash with this counter.
  const prefix = `uc-${key}-`;
  const nextSeq =
    issue.comments.filter((c) => c.id.startsWith(prefix)).length + 1;
  const comment: Comment = {
    id: `${prefix}${nextSeq}-${at}`,
    author,
    body: trimmed,
    createdAt: at,
  };
  issues[index] = {
    ...issue,
    comments: [comment, ...issue.comments],
    updatedAt: at,
  };
  return { issues };
}

// The "current user" a mock comment is attributed to. The composer is the demo
// viewer leaving a comment, so we pick a stable non-agent teammate from the seed
// (the agent authors only its own scripted run logs in 0007). Falls back to the
// first user if, hypothetically, no human exists.
function currentUser(users: User[]): User {
  return users.find((user) => !user.isAgent) ?? users[0];
}

export const useDemoStore = create<DemoState>((set) => ({
  ...createSeed(),
  sidebarCollapsed: false,
  selectedIssueKey: null,

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

  openIssue: (key) => set({ selectedIssueKey: key }),

  closeIssue: () => set({ selectedIssueKey: null }),

  // setStatus reuses the board's pure transition reducer so a dropdown change
  // and a drag are one code path (single source of truth — the board reflects a
  // detail change immediately).
  setStatus: (key, status, now = Date.now) =>
    set((state) => applyMoveIssue(state, key, status, now)),

  setDescription: (key, description, now = Date.now) =>
    set((state) => applySetDescription(state, key, description, now)),

  addComment: (key, body, now = Date.now) =>
    set((state) =>
      applyAddComment(state, key, body, currentUser(state.users), now),
    ),

  reset: () =>
    set({ ...createSeed(), sidebarCollapsed: false, selectedIssueKey: null }),
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

// The issue whose detail view is open, or undefined when none is selected (board
// view) or the selected key resolves to no issue. The IssueDetail modal keys its
// open/closed state off this being defined.
export function selectSelectedIssue(state: DemoState): Issue | undefined {
  return state.selectedIssueKey === null
    ? undefined
    : selectIssueByKey(state, state.selectedIssueKey);
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
