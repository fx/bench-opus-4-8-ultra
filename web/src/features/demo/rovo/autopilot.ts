import { STATUS_ORDER, type Issue, type Status } from "../data/types.ts";

// The Agentic Autopilot engine (see docs/changes/0007 › Autopilot). When ON,
// Autopilot autonomously advances issues one column toward Done over time. This
// PURE module owns the selection + jitter logic; the store holds the enabled
// flag and accumulated time, and the React clock shim feeds it real deltas. No
// Date.now, no Math.random — jitter is SEEDED so a test fast-forwarding the clock
// gets a deterministic sequence of moves.

// The base cadence: Autopilot fires roughly every this-many ms. Real jitter is
// applied per tick (see jitteredInterval) so movements feel organic, not metronomic.
export const AUTOPILOT_BASE_INTERVAL_MS = 1500;

// The next status one column toward Done, or null if already Done. Drives the
// autonomous advance: an issue steps todo→in_progress→in_review→done.
export function nextStatus(status: Status): Status | null {
  const index = STATUS_ORDER.indexOf(status);
  // Last column (done) → no further status. Otherwise the next in board order.
  if (index === -1 || index >= STATUS_ORDER.length - 1) {
    return null;
  }
  return STATUS_ORDER[index + 1];
}

// A deterministic seeded jitter in [0,1): a tiny LCG-style hash of the tick
// ordinal. Pure (depends only on `seed`), so the same tick number always yields
// the same jitter — fast-forwarding the clock in a test reproduces the exact
// movement schedule. Not for cryptographic use; just plausible-looking variance.
export function seededJitter(seed: number): number {
  // A 32-bit integer hash (xorshift-ish) folded to [0,1). `>>> 0` keeps it
  // unsigned; dividing by 2^32 maps to the unit interval.
  let x = (seed + 1) * 2654435761;
  x ^= x >>> 13;
  x = (x * 1274126177) >>> 0;
  return (x >>> 0) / 4294967296;
}

// The (jittered) interval before the Nth autopilot move, in ms. The base
// interval ± up to 50%, seeded by the move ordinal so the schedule is
// deterministic. Always positive (base * [0.5, 1.5)).
export function jitteredInterval(moveOrdinal: number): number {
  const jitter = seededJitter(moveOrdinal); // [0,1)
  // Map [0,1) → [0.5, 1.5) and scale the base interval.
  return Math.round(AUTOPILOT_BASE_INTERVAL_MS * (0.5 + jitter));
}

// pickAutopilotTarget chooses the issue Autopilot advances next: the FIRST issue
// (in seed order) not yet Done. Returns its key + the next status, or null when
// every issue is already Done (Autopilot has nothing left to ship — it idles).
// Deterministic given the issues array, so movement order is testable.
//
// `excludeKey` skips one issue — the one a MANUAL agent run is currently
// implementing — so Autopilot never moves it out from under the run. That keeps
// the cancellation contract intact: cancelling a run leaves its issue untouched,
// which Autopilot must not violate by advancing that same issue concurrently.
export function pickAutopilotTarget(
  issues: Issue[],
  excludeKey?: string,
): { key: string; status: Status } | null {
  for (const issue of issues) {
    if (issue.key === excludeKey) {
      continue;
    }
    const next = nextStatus(issue.status);
    if (next !== null) {
      return { key: issue.key, status: next };
    }
  }
  return null;
}
