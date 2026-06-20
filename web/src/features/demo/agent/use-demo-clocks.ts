import { useCallback, useEffect } from "react";
import { useReducedMotionSafe } from "../../../components/motion/use-reduced-motion-safe.ts";
import { useDemoStore } from "../store/store.ts";
import { useAgentClock } from "./use-agent-clock.ts";

// useDemoClocks is the SHELL-LEVEL clock driver for every time-driven simulation
// in the demo (the agent run and Autopilot). It is mounted ONCE at the AppShell
// root — which never unmounts while the demo is open — so the simulations keep
// progressing regardless of which view is shown or whether the agent panel /
// Autopilot toggle happens to be on screen.
//
// Why shell-level (not in AgentPanel / Autopilot): those components unmount when
// the issue detail closes or the user navigates to the roster, and an interval
// owned by an unmounted component stops. Driving the clocks here decouples
// "is the run/Autopilot logically active" (store state) from "is its UI visible".
// The store actions remain pure + injectable-clock; this hook is the single thin
// real-timer shim (alongside useAgentClock), fully covered by tests.

export function useDemoClocks(): void {
  const reduced = useReducedMotionSafe();

  // Agent run: tick while a run is actively running AND motion is allowed. Under
  // reduced motion the run is fast-forwarded to completion in one shot below, so
  // the cadence clock is disabled.
  const agentRunning = useDemoStore(
    (state) => state.agentRun !== null && state.agentRun.status === "running",
  );
  const advanceAgent = useDemoStore((state) => state.advanceAgent);
  const tickAgent = useCallback(
    (deltaMs: number) => advanceAgent(deltaMs),
    [advanceAgent],
  );
  useAgentClock(agentRunning && !reduced, tickAgent);
  // Reduced motion: finish a live run with one huge delta (no slow reveal, no
  // caret), per the reduced-motion requirement. This runs in an effect right
  // after the activating commit — NOT during render and NOT on a timer tick — so
  // the run jumps straight to done and the final streamed text paints on the next
  // frame, with no streaming animation. Advancing to done flips `agentRunning`
  // false, so this effect won't re-fire.
  useEffect(() => {
    if (agentRunning && reduced) {
      advanceAgent(Number.MAX_SAFE_INTEGER);
    }
  }, [agentRunning, reduced, advanceAgent]);

  // Autopilot: tick while enabled, independent of the board view being mounted.
  const autopilotEnabled = useDemoStore((state) => state.autopilotEnabled);
  const tickAutopilot = useDemoStore((state) => state.tickAutopilot);
  const tickPilot = useCallback(
    (deltaMs: number) => tickAutopilot(deltaMs),
    [tickAutopilot],
  );
  useAgentClock(autopilotEnabled, tickPilot);
}
