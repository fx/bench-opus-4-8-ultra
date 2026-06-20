import type { KeyboardEvent, MouseEvent } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/button.tsx";
import { cn } from "../../../lib/cn.ts";
import { useDemoStore } from "../store/store.ts";

// The flashy "✨ Implement now with AI" action (see docs/changes/0007 ›
// Simulated streaming agent). It starts a simulated agent run for an issue via
// the store; the AgentPanel (rendered elsewhere — the card opens detail, the
// detail hosts the panel) then streams the run. Used on every board Card (hover
// slot) and in the IssueDetail. A tiny wrapper so the card/detail slots stay
// declarative and the start action has ONE implementation.
//
// CONTRAST: the button uses the design-system primary variant (white text on
// the live `--primary` token #0058CC ≈ 6.43:1 in the Jira theme — already
// AA-guarded by the theme contrast tests), so it introduces NO new hardcoded
// text-on-color. Focus ring + disabled state come from the Button primitive.

export interface ImplementWithAiButtonProps {
  issueKey: string;
  // Compact variant for the dense card hover slot (smaller, icon-forward).
  compact?: boolean;
  // Called after the run is started (e.g. the card opens the detail view so the
  // user sees the panel). Optional.
  onStarted?: (key: string) => void;
  className?: string;
}

export function ImplementWithAiButton({
  issueKey,
  compact = false,
  onStarted,
  className,
}: ImplementWithAiButtonProps) {
  const startAgent = useDemoStore((state) => state.startAgent);
  // Disable while THIS issue already has a running run, so a double-click can't
  // restart it mid-stream. Other issues' runs don't disable this button.
  const running = useDemoStore(
    (state) =>
      state.agentRun !== null &&
      state.agentRun.issueKey === issueKey &&
      state.agentRun.status === "running",
  );

  function handleClick(event: MouseEvent) {
    // Stop the click bubbling to the host board Card: the card's onClick opens
    // the issue detail, so without this a card-slot click would BOTH start the
    // run and (redundantly/contradictorily) trigger the card's own open. We open
    // the detail explicitly via onStarted instead, keeping the control's effect
    // self-contained.
    event.stopPropagation();
    startAgent(issueKey);
    onStarted?.(issueKey);
  }

  // Stop activation keys (Space/Enter) from reaching the host card's onKeyDown.
  // The board Card forwards keydown to @dnd-kit's keyboard drag sensor, where
  // Space is the drag start/end key and Enter opens the detail — so a keyboard
  // user activating this nested button would otherwise ALSO start a drag / open
  // the card. Stopping propagation for these keys keeps the button's activation
  // (which the browser still dispatches as a click → handleClick) isolated.
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === " " || event.key === "Enter") {
      event.stopPropagation();
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={running}
      data-testid="implement-with-ai"
      aria-label={`Implement ${issueKey} now with AI`}
      className={cn(
        "gap-1.5 font-medium",
        compact && "h-7 px-2 text-xs shadow-sm",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {compact ? "AI" : "Implement now with AI"}
    </Button>
  );
}
