import { Bot } from "lucide-react";
import { Switch } from "../../../components/ui/switch.tsx";
import { useDemoStore } from "../store/store.ts";

// The Agentic Autopilot board toggle (see docs/changes/0007 › Autopilot). A
// labelled Switch on the board top bar: ON → Rovo autonomously ships cards toward
// Done over time; OFF → autonomy halts. The autonomy logic is pure (store
// `tickAutopilot` + the autopilot engine), and the actual ticking is driven by
// the SHELL-LEVEL clock (useDemoClocks) keyed off `autopilotEnabled` — NOT by
// this component — so Autopilot keeps shipping cards even when the board (and
// this toggle) is unmounted, e.g. while the user is on the Rovo Agents roster.
// This component is purely the toggle's presentation + the on/off store action.
//
// CONTRAST: text uses theme tokens (foreground / muted-foreground) — no hardcoded
// text-on-color. The Switch primitive carries its own focus ring + on/off colours
// (primary when checked, panel when unchecked, both AA in the Jira theme).
// A11y: the Switch is labelled "Agentic Autopilot" and its on/off state is
// conveyed by the native switch role + aria-checked Radix provides.

export function Autopilot() {
  const enabled = useDemoStore((state) => state.autopilotEnabled);
  const toggleAutopilot = useDemoStore((state) => state.toggleAutopilot);

  return (
    <label
      data-testid="autopilot-toggle"
      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary/30 bg-panel px-2.5 py-1.5"
    >
      <Bot
        className={
          enabled ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"
        }
        aria-hidden="true"
      />
      <span className="flex flex-col leading-tight">
        <span className="text-xs font-semibold text-foreground">
          Agentic Autopilot
        </span>
        <span className="text-[10px] text-muted-foreground">
          {enabled ? "Rovo is running the sprint…" : "Let Rovo run the sprint"}
        </span>
      </span>
      <Switch
        checked={enabled}
        onCheckedChange={toggleAutopilot}
        aria-label="Agentic Autopilot"
        className="ml-1"
      />
    </label>
  );
}
