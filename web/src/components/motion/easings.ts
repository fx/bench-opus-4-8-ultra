import type { Transition, Variants } from "motion/react";

// Single source of easing curves so feature code never hand-rolls easings.
// EASE_OUT is the strong ease-out used for entrances; EASE_IN_OUT for symmetric
// transitions.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

// Default durations (seconds) shared across primitives.
export const DURATION = {
  fast: 0.2,
  base: 0.5,
  slow: 0.8,
} as const;

// fade-up entrance: opacity 0→1 and y 24→0 with the shared ease-out. The reduced
// variant drops the transform so reduced-motion users get an opacity-only (or
// instant) appearance with no translate.
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeUpTransition: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT,
};

// Stagger container: children animate in sequence. The container itself has no
// visual change; it only orchestrates child timing.
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};
