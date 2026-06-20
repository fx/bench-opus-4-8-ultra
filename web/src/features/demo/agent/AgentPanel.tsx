import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "../../../components/ui/button.tsx";
import { useReducedMotionSafe } from "../../../components/motion/use-reduced-motion-safe.ts";
import { cn } from "../../../lib/cn.ts";
import type { Issue } from "../data/types.ts";
import { useDemoStore } from "../store/store.ts";
import {
  isRunFinished,
  stepViews,
  type AgentStepView,
} from "./agent-engine.ts";
import { AGENT_DONE_BANNER_BG, AGENT_DONE_COLOR } from "./agent-colors.ts";

// The simulated-agent panel (see docs/changes/0007 › Agent panel). It renders the
// live run as a terminal-style log: an ordered list of steps, each transitioning
// pending → running (with a blinking caret on the streaming text) → done (green
// check), then a terminal "shipped to Done" banner. A Cancel button stops the run
// mid-stream. The whole stream is a PURE projection of the store's run state; the
// run is advanced by the SHELL-LEVEL clock (useDemoClocks, mounted at the
// AppShell root), NOT by this panel — so a run keeps progressing to completion
// even if the panel unmounts (e.g. the user closes the issue detail mid-run).
//
// REDUCED MOTION: under prefers-reduced-motion the caret does NOT blink (the
// CSS-animation guard zeroes the keyframe; we also drop the animate class) and
// the streamed text simply appears — no motion is introduced by this component
// beyond the (guarded) caret blink. The streaming cadence itself is unaffected
// (it's content reveal, not motion), so the run still "feels live".
//
// A11y: the log is an aria-live="polite" region so a screen reader is told when a
// new step starts/finishes, WITHOUT announcing every streamed word (we announce
// step labels + states, not the per-word text — that would spam). Cancel and the
// done/cancelled state are clearly labelled.

export interface AgentPanelProps {
  issue: Issue;
}

// A single step row: status glyph, label, and the streamed output with a caret
// while running. Split out so the list stays declarative and each row's state is
// obvious.
function StepRow({
  view,
  caretBlinks,
}: {
  view: AgentStepView;
  caretBlinks: boolean;
}) {
  const { step, state, streamedOutput } = view;
  return (
    <li
      data-testid="agent-step"
      data-step-state={state}
      className="flex gap-2 text-sm"
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        {state === "done" ? (
          // AA-safe green text/icon on the light panel (see agent-colors.ts).
          <Check className="h-4 w-4" style={{ color: AGENT_DONE_COLOR }} />
        ) : state === "running" ? (
          <Loader2
            className={cn(
              "h-4 w-4 text-primary",
              caretBlinks && "animate-spin",
            )}
          />
        ) : (
          <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
            ·
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-medium",
            state === "pending" ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {step.label}
          {state === "running" && "…"}
        </p>
        {/* Streamed output. Pending steps render nothing; running shows the
            partial text with a caret; done shows the full text. */}
        {state !== "pending" && (
          <p className="mt-0.5 whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
            {streamedOutput}
            {state === "running" && (
              <span
                data-testid="agent-caret"
                // The blinking caret. Under reduced motion we drop the blink
                // class so it renders as a static block (the global CSS guard
                // also zeroes the animation, but dropping the class is explicit
                // and keeps the DOM honest). It is decorative.
                className={cn(
                  "ml-px inline-block h-3.5 w-1.5 translate-y-0.5 bg-primary",
                  caretBlinks && "animate-pulse",
                )}
                aria-hidden="true"
              />
            )}
          </p>
        )}
      </div>
    </li>
  );
}

export function AgentPanel({ issue }: AgentPanelProps) {
  const run = useDemoStore((state) => state.agentRun);
  const cancelAgent = useDemoStore((state) => state.cancelAgent);
  const clearAgentRun = useDemoStore((state) => state.clearAgentRun);
  const reduced = useReducedMotionSafe();

  // Is the panel showing a run for THIS issue? The panel is rendered per issue
  // (card/detail slot), but only one run exists in the store — guard on the run
  // targeting this issue so a card whose run isn't active stays inert. The run is
  // advanced by the SHELL-LEVEL clock (useDemoClocks), not here, so the run keeps
  // progressing even if this panel unmounts (e.g. the detail closes mid-run).
  const isThisIssue = run !== null && run.issueKey === issue.key;

  if (!isThisIssue) {
    return null;
  }

  const views = stepViews(run.steps, run.elapsedMs);
  const finished = isRunFinished(run);
  const doneCount = views.filter((v) => v.state === "done").length;

  return (
    <section
      data-testid="agent-panel"
      data-run-status={run.status}
      aria-label="AI agent run"
      className="flex flex-col gap-3 rounded-md border border-primary/30 bg-panel p-3"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="flex-1 text-sm font-semibold text-foreground">
          Rovo is implementing {issue.key}
        </h3>
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          {doneCount}/{run.steps.length}
        </span>
      </div>

      {/* The terminal-style streamed log. aria-live announces step transitions
          (labels + state via the row content) without spamming per word. */}
      <ol
        data-testid="agent-log"
        aria-live="polite"
        aria-busy={run.status === "running"}
        className="flex flex-col gap-2"
      >
        {views.map((view) => (
          <StepRow key={view.step.id} view={view} caretBlinks={!reduced} />
        ))}
      </ol>

      {/* Terminal banners. Done → shipped; cancelled → stopped. The done banner
          paints AA-safe green text on a 10% green tint over the panel — both the
          colour and that effective background are guarded by
          agent-colors.contrast.test.ts. */}
      {run.status === "done" && (
        <p
          data-testid="agent-done"
          className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-semibold"
          style={{
            color: AGENT_DONE_COLOR,
            backgroundColor: AGENT_DONE_BANNER_BG,
          }}
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Shipped {issue.key} to Done. Rovo handled this. Velocity up 4000%.
        </p>
      )}
      {run.status === "cancelled" && (
        <p
          data-testid="agent-cancelled"
          className="rounded-sm bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground"
        >
          Run cancelled. {issue.key} was left untouched (still not Done).
        </p>
      )}

      <div className="flex justify-end">
        {finished ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearAgentRun}
            data-testid="agent-dismiss"
          >
            Dismiss
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={cancelAgent}
            data-testid="agent-cancel"
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
        )}
      </div>
    </section>
  );
}
