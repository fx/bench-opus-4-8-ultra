import { useEffect } from "react";

// The single real-timer shim that drives the deterministic agent/autopilot
// engines (see docs/changes/0007 › "the only place real timers live"). The
// engines are pure functions of elapsed time; this hook is the thin bridge that,
// while `active`, calls `onTick(deltaMs)` so the store can advance the run. ALL
// simulation logic lives in the pure engine + store — this hook contains no
// scripting, just a setInterval that reports the REAL elapsed milliseconds since
// the previous tick. It is intentionally tiny and fully covered (no exclusions).
//
// Why measured elapsed (not the fixed interval): browsers throttle timers in
// background tabs / inactive windows / low-power mode, so a fired interval can
// represent far MORE than `intervalMs` of wall-clock time. Passing the measured
// delta (now - last via performance.now()) keeps the simulation tracking
// wall-clock — it doesn't drift slower under throttling and "catches up" with a
// larger delta after a long-delayed fire — matching the change-doc's real-timing
// goal. `intervalMs` remains only the SCHEDULING cadence for setInterval.
//
// Determinism in tests: the engine tests call the pure store actions
// (advanceAgent/tickAutopilot) with explicit deltas under fake timers. This hook
// is covered by its own focused test that fakes timers AND mocks performance.now
// to controlled values, asserting it ticks with the MEASURED delta and
// stops/clears on deactivate/unmount (no leaked interval — the cancellation-leak
// lesson).

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
    // Anchor the elapsed-time measurement at the moment the interval starts, so
    // the FIRST tick reports the actual time since it was scheduled (not a
    // hardcoded intervalMs). performance.now() is a monotonic high-resolution
    // clock available in all supported browsers and jsdom.
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      // The REAL elapsed time since the previous fire. Under throttling this can
      // exceed intervalMs (a delayed/coalesced fire), so the simulation advances
      // by the true wall-clock amount and stays in sync.
      const deltaMs = now - last;
      last = now;
      onTick(deltaMs);
    }, intervalMs);
    // Cleanup clears the pending interval on deactivate or unmount, so a
    // cancelled/finished run leaves NO orphaned timer ticking the store.
    return () => clearInterval(id);
  }, [active, onTick, intervalMs]);
}
