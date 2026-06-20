import type { AgentStep, Issue } from "../data/types.ts";
import { buildAgentScript } from "./agent-script.ts";

// The pure, deterministic agent simulation engine (see docs/changes/0007 ›
// Approach). Given an issue it produces an ordered script of AgentSteps and
// models word-by-word streaming as a PURE FUNCTION OF ELAPSED TIME: there is no
// setTimeout, no Date.now, no LLM and no network in here. The React layer owns
// the single real timer (use-agent-clock.ts) and feeds elapsed milliseconds into
// `advanceRun`; everything the panel renders is derived deterministically from
// that elapsed value, so tests fast-forward by passing elapsed times directly.
//
// Word-chunked streaming (the change's chosen granularity): each step's `output`
// is split into words and revealed over the step's `durationMs`, so text appears
// incrementally with a caret. Steps run strictly in order — a step only starts
// streaming once all prior steps' durations have elapsed — so the panel shows
// running → done in sequence.

// RunStatus is the lifecycle of a single agent run. `idle` never appears in a
// live run object (a run is created already `running`); it exists in the union
// for the store's "no run" sentinel symmetry and the AgentRun data model.
export type RunStatus = "running" | "done" | "cancelled";

// A per-step view the panel renders: the script step plus its derived live
// state (pending/running/done) and the streamed-so-far text. `streamedOutput`
// grows from "" to the full `step.output` as the run advances.
export interface AgentStepView {
  step: AgentStep;
  state: "pending" | "running" | "done";
  streamedOutput: string;
}

// AgentRunState is the engine's immutable run snapshot. It is fully derived from
// (steps, elapsedMs, status): the same triple always yields the same views, so
// it is trivially testable and the panel is a pure projection of it.
export interface AgentRunState {
  issueKey: string;
  steps: AgentStep[];
  // Total elapsed run time in ms (sum of advances). Drives all streaming.
  elapsedMs: number;
  status: RunStatus;
  // Index of the step currently streaming, or steps.length once every step is
  // done (used by the panel for the "running step" highlight + progress count).
  currentStep: number;
}

// The whole run's natural duration: the sum of every step's durationMs. Once
// elapsed reaches this, all steps are done and the run is ready to finish.
export function totalDurationMs(steps: AgentStep[]): number {
  return steps.reduce((sum, step) => sum + step.durationMs, 0);
}

// createAgentRun builds the initial RUNNING state for an issue: the scripted
// steps, zero elapsed, status running. Pure — no clock read.
export function createAgentRun(issue: Issue): AgentRunState {
  return {
    issueKey: issue.key,
    steps: buildAgentScript(issue),
    elapsedMs: 0,
    status: "running",
    currentStep: 0,
  };
}

// Split a step's output into words, KEEPING the trailing space on each word so
// re-joining the revealed prefix reproduces the original spacing exactly (no
// collapsed or doubled spaces). A word here is "non-space run + following
// spaces"; the final word simply has no trailing space.
function splitWords(output: string): string[] {
  // Match runs of non-whitespace followed by any whitespace, so each chunk is a
  // word plus its trailing separator. An empty output yields an empty list.
  return output.match(/\S+\s*/g) ?? [];
}

// streamedPrefix returns how much of `output` is visible after `fraction`
// (0..1) of the step's duration has elapsed, revealed word-by-word. fraction ≤ 0
// shows nothing; fraction ≥ 1 shows the whole output. In between, it reveals
// ceil(fraction * wordCount) words so streaming starts as soon as a step begins
// (the first word appears immediately) and the last word lands exactly at 1.
export function streamedPrefix(output: string, fraction: number): string {
  if (fraction <= 0) {
    return "";
  }
  const words = splitWords(output);
  if (fraction >= 1 || words.length === 0) {
    return output;
  }
  const revealed = Math.min(words.length, Math.ceil(fraction * words.length));
  return words.slice(0, revealed).join("");
}

// stepViews derives the per-step views for a given elapsed time. It walks the
// steps accumulating their durations: a step whose window is fully before
// `elapsed` is done (full output); the one containing `elapsed` is running
// (partial output by its local fraction); later steps are pending (no output).
// When the run is finished/cancelled the caller passes the appropriate elapsed
// so this still holds (a cancelled run freezes mid-stream; a done run shows all).
export function stepViews(
  steps: AgentStep[],
  elapsedMs: number,
): AgentStepView[] {
  const views: AgentStepView[] = [];
  let consumed = 0;
  let activeFound = false;
  for (const step of steps) {
    const start = consumed;
    const end = consumed + step.durationMs;
    let state: AgentStepView["state"];
    let streamedOutput: string;
    if (elapsedMs >= end) {
      // Entirely in the past → done, full output.
      state = "done";
      streamedOutput = step.output;
    } else if (!activeFound && elapsedMs >= start) {
      // The step containing `elapsed` → running, partial output. Guarded by
      // activeFound so only ONE step is marked running even if two share a
      // boundary instant. A zero-duration step can NEVER be the running one: its
      // window [start, start] is empty, so at elapsed ≥ start it is already
      // `>= end` and handled by the done branch above — hence dividing by
      // durationMs here is always a division by a positive number.
      activeFound = true;
      state = "running";
      streamedOutput = streamedPrefix(
        step.output,
        (elapsedMs - start) / step.durationMs,
      );
    } else {
      // Future step → pending, nothing streamed yet.
      state = "pending";
      streamedOutput = "";
    }
    views.push({ step, state, streamedOutput });
    consumed = end;
  }
  return views;
}

// currentStepIndex is the index of the step currently streaming for a given
// elapsed time, or steps.length when every step is done. Used for the panel's
// "Step N of M" progress and to drive the currentStep field on the run state.
export function currentStepIndex(
  steps: AgentStep[],
  elapsedMs: number,
): number {
  let consumed = 0;
  for (let i = 0; i < steps.length; i += 1) {
    consumed += steps[i].durationMs;
    if (elapsedMs < consumed) {
      return i;
    }
  }
  return steps.length;
}

// advanceRun is the engine's single tick reducer: add `deltaMs` of elapsed time
// and recompute the run. A non-positive delta, or advancing a run that is no
// longer running (done/cancelled), returns the SAME reference so callers /
// subscribers don't churn (mirrors the store's no-op convention). When the
// accumulated elapsed reaches the script's total duration the run flips to
// `done` (clamped so elapsed never overshoots the total). Cancellation is a
// separate action (cancelRun) — advancing never cancels.
export function advanceRun(
  state: AgentRunState,
  deltaMs: number,
): AgentRunState {
  if (state.status !== "running" || deltaMs <= 0) {
    return state;
  }
  const total = totalDurationMs(state.steps);
  const elapsedMs = Math.min(state.elapsedMs + deltaMs, total);
  const done = elapsedMs >= total;
  return {
    ...state,
    elapsedMs,
    status: done ? "done" : "running",
    currentStep: currentStepIndex(state.steps, elapsedMs),
  };
}

// cancelRun stops a running run, freezing its elapsed time (so the panel keeps
// the partially-streamed text it had at the moment of cancel — the run reads as
// "interrupted", not reset). Cancelling an already-terminal run (done/cancelled)
// is a no-op returning the SAME reference. The store guarantees a cancelled run
// does NOT mark the issue Done.
export function cancelRun(state: AgentRunState): AgentRunState {
  if (state.status !== "running") {
    return state;
  }
  return { ...state, status: "cancelled" };
}

// isRunFinished reports whether a run has reached a terminal state (done OR
// cancelled) — i.e. the React clock shim can stop ticking. Kept as a tiny
// predicate so the shim and the store share one definition of "stop".
export function isRunFinished(state: AgentRunState): boolean {
  return state.status !== "running";
}
