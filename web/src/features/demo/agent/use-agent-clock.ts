import { useEffect } from "react";

// The single real-timer shim that drives the deterministic agent/autopilot
// engines (see docs/changes/0007 › "the only place real timers live"). The
// engines are pure functions of elapsed time; this hook is the thin bridge that,
// while `active`, calls `onTick(deltaMs)` on a fixed cadence so the store can
// advance the run. ALL simulation logic lives in the pure engine + store — this
// hook contains no scripting, just a setInterval that reports real elapsed
// milliseconds. It is intentionally tiny and fully covered (no exclusions).
//
// Determinism in tests: tests never mount this hook to assert engine behaviour —
// they call the pure store actions (advanceAgent/tickAutopilot) with explicit
// deltas under fake timers. This hook is covered by its own focused test that
// fakes timers and asserts it ticks while active and stops/clears on
// deactivate/unmount (no leaked interval — the cancellation-leak lesson).

// The wall-clock cadence of a tick, in ms. Small enough that word-chunked
// streaming looks smooth, large enough to avoid churning React every frame.
export const AGENT_TICK_MS = 80;

export function useAgentClock(
  active: boolean,
  onTick: (deltaMs: number) => void,
  intervalMs: number = AGENT_TICK_MS,
): void {
  useEffect(() => {
    // Inactive → no interval at all (and any previous one was already cleared by
    // the cleanup below when `active` flipped to false). This is what makes
    // cancel/finish promptly stop the stream: the store flips the run terminal,
    // the consumer passes active=false, and this effect tears the interval down.
    if (!active) {
      return;
    }
    const id = setInterval(() => {
      onTick(intervalMs);
    }, intervalMs);
    // Cleanup clears the pending interval on deactivate or unmount, so a
    // cancelled/finished run leaves NO orphaned timer ticking the store.
    return () => clearInterval(id);
  }, [active, onTick, intervalMs]);
}
