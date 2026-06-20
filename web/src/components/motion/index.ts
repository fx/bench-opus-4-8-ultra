// Public surface of the motion primitives. Feature code imports easings,
// variants, and components from here so there is one source of truth.
export {
  EASE_OUT,
  EASE_IN_OUT,
  DURATION,
  fadeUpVariants,
  fadeUpReducedVariants,
  fadeUpTransition,
  staggerContainerVariants,
} from "./easings.ts";
export { useReducedMotionSafe } from "./use-reduced-motion-safe.ts";
export { FadeUp } from "./FadeUp.tsx";
export type { FadeUpProps } from "./FadeUp.tsx";
export { Stagger } from "./Stagger.tsx";
export type { StaggerProps } from "./Stagger.tsx";
export { CountUp } from "./CountUp.tsx";
export type { CountUpProps, CountUpClock } from "./CountUp.tsx";
export { Marquee } from "./Marquee.tsx";
export type { MarqueeProps } from "./Marquee.tsx";
