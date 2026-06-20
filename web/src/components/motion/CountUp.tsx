import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "./use-reduced-motion-safe.ts";

// A minimal clock abstraction so tests can drive the animation deterministically
// without real rAF/timestamps. Production uses requestAnimationFrame +
// performance.now via the default clock.
export interface CountUpClock {
  now: () => number;
  requestFrame: (cb: (time: number) => void) => number;
  cancelFrame: (handle: number) => void;
}

const defaultClock: CountUpClock = {
  now: () => performance.now(),
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
};

// easeOut applies a strong cubic ease-out (1 - (1 - t)^3) to progress t∈[0,1].
// This matches the "strong ease-out" character of the shared EASE_OUT curve
// (fast start, gentle settle) while staying a closed-form, fully-deterministic
// function — the count-up only needs the eased progress, not the exact bezier.
function easeOut(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

export interface CountUpProps {
  // Target value the counter animates to.
  to: number;
  // Value to start from (default 0).
  from?: number;
  // Animation duration in milliseconds.
  durationMs?: number;
  // Decimal places to render.
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  // Injectable clock for deterministic tests; defaults to rAF + performance.now.
  clock?: CountUpClock;
}

function format(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

// CountUp animates a number from `from` to `to` over `durationMs` using the
// injectable clock and the shared ease-out curve. When reduced motion is
// requested it renders the final value immediately and runs no animation.
export function CountUp({
  to,
  from = 0,
  durationMs = 1500,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  clock = defaultClock,
}: CountUpProps) {
  const reduced = useReducedMotionSafe();
  const [value, setValue] = useState(() => (reduced ? to : from));
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Reduced motion: short-circuit to the final value, no animation scheduled.
    if (reduced) {
      setValue(to);
      return;
    }

    setValue(from);
    const start = clock.now();

    const tick = (time: number) => {
      const elapsed = time - start;
      const t = durationMs <= 0 ? 1 : Math.min(elapsed / durationMs, 1);
      const eased = easeOut(t);
      setValue(from + (to - from) * eased);
      if (t < 1) {
        frameRef.current = clock.requestFrame(tick);
      }
    };

    frameRef.current = clock.requestFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        clock.cancelFrame(frameRef.current);
      }
    };
  }, [to, from, durationMs, reduced, clock]);

  return (
    <span className={className}>
      {prefix}
      {format(value, decimals)}
      {suffix}
    </span>
  );
}
