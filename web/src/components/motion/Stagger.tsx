import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotionSafe } from "./use-reduced-motion-safe.ts";
import { staggerContainerVariants } from "./easings.ts";

export interface StaggerProps {
  children?: ReactNode;
  className?: string;
  // When true (default) the container orchestrates its children once it scrolls
  // into view; otherwise it orchestrates on mount.
  whileInView?: boolean;
}

// Stagger is the container that sequences child entrance animations (compose
// with FadeUp children). Under reduced motion the stagger timing is dropped so
// all children appear together with no sequential transform animation.
export function Stagger({
  children,
  className,
  whileInView = true,
}: StaggerProps) {
  const reduced = useReducedMotionSafe();
  const variants = reduced ? undefined : staggerContainerVariants;
  const animateProps = whileInView
    ? { whileInView: "visible", viewport: { once: true, amount: 0.2 } }
    : { animate: "visible" };

  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={variants}
      {...animateProps}
    >
      {children}
    </motion.div>
  );
}
