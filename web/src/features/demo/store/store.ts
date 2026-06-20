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
import {
  advanceRun,
  cancelRun,
  createAgentRun,
  isRunFinished,
  type AgentRunState,
} from "../agent/agent-engine.ts";
import { agentRunSummary } from "../agent/agent-script.ts";
import {
  askRovo as selectRovoAnswer,
  type RovoAnswer,
} from "../rovo/ask-rovo.ts";
import {
  generateDescription as buildGeneratedDescription,
  generateReply as buildGeneratedReply,
  generateSummary as buildGeneratedSummary,
} from "../rovo/ai-generate.ts";
import { jitteredInterval, pickAutopilotTarget } from "../rovo/autopilot.ts";

// The sidebar views the demo can show in its main area. Only "board" and
// "agents" (the Rovo Agents roster, 0007) are real destinations; the rest of the
// sidebar items remain visual placeholders. Kept a small union so the roster
// route is type-safe and the store is the single source of truth for which view
// is active.
export type DemoView = "board" | "agents";

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

  // ── 0007 agentic state ──────────────────────────────────────────────────────
  // The active simulated-agent run, or null when no run is in flight. Only ONE
  // run exists at a time (a single agent panel) — starting a new run replaces any
  // finished one. The engine state is pure (see agent/agent-engine.ts); the React
  // clock shim advances it via `advanceAgent`.
  agentRun: AgentRunState | null;
  // Whether Agentic Autopilot is ON (the board toggle). While ON, `tickAutopilot`
  // autonomously advances issues toward Done; OFF halts further movement.
  autopilotEnabled: boolean;
  // Accumulated time (ms) Autopilot has run since the last move fired. Compared
  // against a jittered interval to decide when the next autonomous move happens.
  autopilotElapsedMs: number;
  // How many autonomous moves Autopilot has made — seeds the per-move jitter so
  // the schedule is deterministic under a fast-forwarded clock.
  autopilotMoves: number;
  // The most recent "Ask Rovo" scripted answer, or null before any query. Shown
  // in the command bar's results popover.
  rovoAnswer: RovoAnswer | null;
  // The active main-area view: the board, or the Rovo Agents roster (0007). The
  // sidebar "Rovo Agents" item flips this; "Board" flips it back.
  activeView: DemoView;

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

  // ── 0007 agent actions ──────────────────────────────────────────────────────
  // Start a simulated agent run for an issue (the "✨ Implement now with AI"
  // action). Replaces any existing run with a fresh RUNNING run; an unknown key
  // is a no-op (same reference) so callers never pre-validate.
  startAgent: (key: string) => void;
  // Advance the active run by `deltaMs` (driven by the React clock shim). When
  // the run reaches its terminal "done" state THIS tick, the completion side-
  // effects fire: the issue is shipped to Done, marked handledByAgent, and an
  // agent-authored comment is appended to its activity feed. No active run, a
  // non-positive delta, or a run already finished is a no-op (same reference).
  advanceAgent: (deltaMs: number, now?: () => number) => void;
  // Cancel the active run. Streaming stops and the issue is NOT marked Done
  // (cancelling mid-run leaves the issue exactly as it was). No-op (same
  // reference) when there is no running run.
  cancelAgent: () => void;
  // Dismiss/clear the active run (e.g. closing the panel after it finished). A
  // no-op when there is no run. Does not undo a completed run's side-effects.
  clearAgentRun: () => void;

  // ── 0007 autopilot actions ──────────────────────────────────────────────────
  // Flip Autopilot on/off. Turning it OFF also resets the accumulated tick time
  // and move counter so a later re-enable starts a fresh, deterministic schedule.
  toggleAutopilot: () => void;
  // Advance Autopilot by `deltaMs` (driven by the React clock shim while ON).
  // When the accumulated time crosses the next jittered interval, the first
  // not-Done issue advances one column toward Done. A no-op (same reference) when
  // Autopilot is OFF, the delta is non-positive, the interval hasn't elapsed, or
  // every issue is already Done.
  tickAutopilot: (deltaMs: number, now?: () => number) => void;

  // ── 0007 Ask Rovo + AI-generate ─────────────────────────────────────────────
  // Submit an "Ask Rovo" query → store the scripted over-confident answer.
  askRovo: (query: string) => void;
  // Clear the current Rovo answer (closing the results popover).
  clearRovoAnswer: () => void;
  // AI-generate the summary / description of an issue, filling the field with
  // scripted buzzword-bloat text via the SAME description/summary reducers. An
  // unknown key is a no-op (same reference).
  generateSummary: (key: string, now?: () => number) => void;
  generateDescription: (key: string, now?: () => number) => void;
  // "✨ Reply with AI" — append an agent-authored (byAgent) reply comment to the
  // issue's activity feed. An unknown key is a no-op (same reference).
  generateReply: (key: string, now?: () => number) => void;

  // ── 0007 view routing ───────────────────────────────────────────────────────
  // Switch the main-area view (board ↔ Rovo Agents roster). A no-op (same
  // reference) when already on the requested view.
  setView: (view: DemoView) => void;
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
  // 0007: optional flags so the agent-authored "Reply with AI" comment reuses
  // this same de-dup/prepend logic. `byAgent` marks the entry as an AI run log
  // (the activity feed renders the violet "Rovo" badge); `idPrefix` separates the
  // agent reply's monotonic id sequence from the human composer's (`uc-`), so the
  // two counters never collide on the same issue.
  options: { byAgent?: boolean; idPrefix?: string } = {},
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
  // A per-issue monotonic sequence: count how many comments with THIS prefix the
  // issue already has and use the next ordinal. This never repeats for a given
  // issue even under a fixed clock, and is independent of the timestamp, so
  // same-millisecond adds stay unique. Seed/agent comment ids use distinct
  // prefixes, so the counters never clash.
  const prefix = `${options.idPrefix ?? "uc"}-${key}-`;
  const nextSeq =
    issue.comments.filter((c) => c.id.startsWith(prefix)).length + 1;
  const comment: Comment = {
    id: `${prefix}${nextSeq}-${at}`,
    author,
    body: trimmed,
    createdAt: at,
    byAgent: options.byAgent,
  };
  issues[index] = {
    ...issue,
    comments: [comment, ...issue.comments],
    updatedAt: at,
  };
  return { issues };
}

// applyAgentCompletion is the PURE "agent shipped the issue" reducer (0007). When
// a run finishes it: moves the issue to Done, flags `handledByAgent`, and PREPENDS
// an agent-authored run-log comment (byAgent) to the activity feed — all in one
// atomic issues-array update so the board, the agent lozenge, and the feed flip
// together. Attributed to the agent user; the comment id folds the clock so it is
// deterministic yet unique (the feed keys off comment.id). Returns the SAME state
// reference for an unknown key (defensive — the run always references a real
// issue, but a no-op keeps the action safe). Kept beside the other reducers so
// the completion logic is unit-testable without the engine/clock.
export function applyAgentCompletion(
  state: DemoState,
  key: string,
  agent: User,
  now: () => number,
): DemoState | Pick<DemoState, "issues"> {
  const index = state.issues.findIndex((issue) => issue.key === key);
  if (index === -1) {
    return state;
  }
  const issues = state.issues.slice();
  const issue = issues[index];
  const at = now();
  // A per-issue monotonic sequence (mirrors applyAddComment): count existing
  // agent-completion logs on THIS issue (ids prefixed `ac-${key}-`) and use the
  // next ordinal, folded in ALONGSIDE the clock. So a second run that ships the
  // same issue — even under a fixed clock or within the same millisecond — gets a
  // DISTINCT id, since the activity feed keys off comment.id (the 0006 dup-key
  // lesson).
  const prefix = `ac-${key}-`;
  const nextSeq =
    issue.comments.filter((c) => c.id.startsWith(prefix)).length + 1;
  const comment: Comment = {
    id: `${prefix}${nextSeq}-${at}`,
    author: agent,
    body: agentRunSummary(issue),
    createdAt: at,
    byAgent: true,
  };
  issues[index] = {
    ...issue,
    status: "done",
    handledByAgent: true,
    comments: [comment, ...issue.comments],
    updatedAt: at,
  };
  return { issues };
}

// The agent user a run log is attributed to ("Rovo Ultra"), or a synthetic
// fallback if — hypothetically — the seed had no agent. Mirrors currentUser so
// the completion reducer always has a concrete author. Exported so the fallback
// branch (no agent in the user list) is directly unit-testable.
export function agentUser(users: User[]): User {
  return (
    users.find((user) => user.isAgent) ?? {
      id: "rovo-ultra",
      name: "Rovo Ultra",
      initials: "RU",
      avatarColor: "#6554C0",
      isAgent: true,
    }
  );
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
  agentRun: null,
  autopilotEnabled: false,
  autopilotElapsedMs: 0,
  autopilotMoves: 0,
  rovoAnswer: null,
  activeView: "board",

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
    set({
      ...createSeed(),
      sidebarCollapsed: false,
      selectedIssueKey: null,
      agentRun: null,
      autopilotEnabled: false,
      autopilotElapsedMs: 0,
      autopilotMoves: 0,
      rovoAnswer: null,
      activeView: "board",
    }),

  // ── 0007 agent actions ──────────────────────────────────────────────────────
  startAgent: (key) =>
    set((state) => {
      const issue = state.issues.find((i) => i.key === key);
      // Unknown key → no-op (same reference): never start a run for a ticket
      // that doesn't exist.
      if (!issue) {
        return state;
      }
      return { agentRun: createAgentRun(issue) };
    }),

  advanceAgent: (deltaMs, now = Date.now) =>
    set((state) => {
      const run = state.agentRun;
      // No run, or the run is already finished → nothing to advance (same
      // reference). advanceRun also guards a non-positive delta internally.
      if (run === null || isRunFinished(run)) {
        return state;
      }
      const next = advanceRun(run, deltaMs);
      // advanceRun returns the SAME reference for a no-op delta → bail out so
      // subscribers don't churn.
      if (next === run) {
        return state;
      }
      // The run JUST finished on this tick → fire the completion side-effects
      // (ship to Done + agent-handled + run-log comment) atomically with the run
      // update, so the board and the panel flip together. The run always
      // references a real issue (startAgent validated it), so applyAgentCompletion
      // always returns the updated `{ issues }` slice — `completion.issues` is the
      // new array.
      if (next.status === "done") {
        const completion = applyAgentCompletion(
          state,
          next.issueKey,
          agentUser(state.users),
          now,
        );
        return { issues: completion.issues, agentRun: next };
      }
      return { agentRun: next };
    }),

  cancelAgent: () =>
    set((state) => {
      const run = state.agentRun;
      if (run === null) {
        return state;
      }
      const next = cancelRun(run);
      // cancelRun no-ops (same ref) on an already-terminal run → no churn.
      if (next === run) {
        return state;
      }
      return { agentRun: next };
    }),

  clearAgentRun: () =>
    set((state) => (state.agentRun === null ? state : { agentRun: null })),

  // ── 0007 autopilot actions ──────────────────────────────────────────────────
  toggleAutopilot: () =>
    set((state) =>
      state.autopilotEnabled
        ? // Turning OFF: halt and reset the schedule so a later re-enable starts
          // fresh and deterministic.
          { autopilotEnabled: false, autopilotElapsedMs: 0, autopilotMoves: 0 }
        : { autopilotEnabled: true },
    ),

  tickAutopilot: (deltaMs, now = Date.now) =>
    set((state) => {
      // OFF or a non-positive delta → no-op (same reference).
      if (!state.autopilotEnabled || deltaMs <= 0) {
        return state;
      }
      const elapsed = state.autopilotElapsedMs + deltaMs;
      // Not yet time for the next move → just accumulate the elapsed time.
      if (elapsed < jitteredInterval(state.autopilotMoves)) {
        return { autopilotElapsedMs: elapsed };
      }
      // Interval crossed: advance the first not-Done issue one column, EXCLUDING
      // any issue a manual agent run is currently implementing — Autopilot must
      // not move that issue out from under the run (cancelling the run must leave
      // its issue untouched, so Autopilot advancing it concurrently would break
      // that contract).
      const runningKey =
        state.agentRun !== null && state.agentRun.status === "running"
          ? state.agentRun.issueKey
          : undefined;
      const target = pickAutopilotTarget(state.issues, runningKey);
      // Nothing left to ship (everything Done, or only the run's issue remains)
      // → a true no-op: return the SAME state reference so the store stops
      // churning every tick. The shell clock keeps running while Autopilot is ON,
      // but each tick is now a no-op until something becomes movable again (e.g.
      // a run finishes and frees its issue, or a card is dragged back).
      if (target === null) {
        return state;
      }
      // pickAutopilotTarget only returns a target with a valid next status, so
      // applyMoveIssue always produces a real move here (never a same-state
      // no-op) — `moved.issues` is the updated array. Reset the per-move clock and
      // bump the move counter so the NEXT interval uses fresh jitter.
      const moved = applyMoveIssue(state, target.key, target.status, now);
      return {
        issues: moved.issues,
        autopilotElapsedMs: 0,
        autopilotMoves: state.autopilotMoves + 1,
      };
    }),

  // ── 0007 Ask Rovo + AI-generate ─────────────────────────────────────────────
  askRovo: (query) => set({ rovoAnswer: selectRovoAnswer(query) }),

  clearRovoAnswer: () =>
    set((state) => (state.rovoAnswer === null ? state : { rovoAnswer: null })),

  generateSummary: (key, now = Date.now) =>
    set((state) => {
      const issue = state.issues.find((i) => i.key === key);
      if (!issue) {
        return state;
      }
      const index = state.issues.indexOf(issue);
      const issues = state.issues.slice();
      issues[index] = {
        ...issue,
        summary: buildGeneratedSummary(issue),
        updatedAt: now(),
      };
      return { issues };
    }),

  generateDescription: (key, now = Date.now) =>
    set((state) => {
      const issue = state.issues.find((i) => i.key === key);
      if (!issue) {
        return state;
      }
      // Reuse the pure description reducer so AI-generate and inline-edit share
      // one code path; the generated text always differs from the seed, so this
      // never no-ops in practice.
      return applySetDescription(
        state,
        key,
        buildGeneratedDescription(issue),
        now,
      );
    }),

  generateReply: (key, now = Date.now) =>
    set((state) => {
      const issue = state.issues.find((i) => i.key === key);
      if (!issue) {
        return state;
      }
      // Append an agent-authored reply via the shared comment reducer, flagged
      // byAgent (violet "Rovo" badge) with a distinct id prefix so its counter
      // never collides with the human composer's.
      return applyAddComment(
        state,
        key,
        buildGeneratedReply(issue),
        agentUser(state.users),
        now,
        { byAgent: true, idPrefix: "ar" },
      );
    }),

  // ── 0007 view routing ───────────────────────────────────────────────────────
  setView: (view) =>
    set((state) => (state.activeView === view ? state : { activeView: view })),
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

// The issue the active agent run targets, or undefined when no run is in flight
// or the run's issue has gone (defensive). The AgentPanel uses this to title the
// run with the live issue summary.
export function selectAgentRunIssue(state: DemoState): Issue | undefined {
  return state.agentRun === null
    ? undefined
    : selectIssueByKey(state, state.agentRun.issueKey);
}
