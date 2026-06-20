import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotionSafe } from "./use-reduced-motion-safe.ts";

export interface MarqueeProps {
  children?: ReactNode;
  className?: string;
  // Seconds for one full loop. Drives the --marquee-duration CSS variable.
  durationSeconds?: number;
}

// Marquee scrolls its children horizontally in an infinite loop. To make the
// loop seamless the track is duplicated in the DOM (translateX(-50%) animation
// lands exactly on the start of the second copy). Under reduced motion the
// duplicate track and the infinite animation are dropped — the content is
// rendered once, statically.
export function Marquee({
  children,
  className,
  durationSeconds = 30,
}: MarqueeProps) {
  const reduced = useReducedMotionSafe();

  if (reduced) {
    return (
      <div className={cn("overflow-hidden", className)} data-reduced="true">
        <div className="flex w-max">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)} data-reduced="false">
      <div
        className="flex w-max animate-marquee"
        style={
          { "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties
        }
      >
        <div className="flex shrink-0">{children}</div>
        {/* Duplicate copy makes the -50% loop seamless. `inert` removes it from
            the a11y tree AND from the focus/pointer order, so keyboard users
            never tab into the visually-redundant clone of interactive children. */}
        <div className="flex shrink-0" inert>
          {children}
        </div>
      </div>
    </div>
  );
}
