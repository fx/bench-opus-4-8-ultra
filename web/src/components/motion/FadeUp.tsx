import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotionSafe } from "./use-reduced-motion-safe.ts";
import {
  fadeUpReducedVariants,
  fadeUpTransition,
  fadeUpVariants,
} from "./easings.ts";

export interface FadeUpProps {
  children?: ReactNode;
  className?: string;
  // Delay (seconds) before this element animates — useful for manual sequencing
  // outside a Stagger container.
  delay?: number;
  // When true (default) the element animates once as it scrolls into view;
  // otherwise it animates on mount.
  whileInView?: boolean;
}

// FadeUp fades + lifts its children into place using the shared fade-up variant.
// When reduced motion is requested it uses the opacity-only variant (no
// translate). It animates once on scroll-into-view by default.
export function FadeUp({
  children,
  className,
  delay = 0,
  whileInView = true,
}: FadeUpProps) {
  const reduced = useReducedMotionSafe();
  const variants = reduced ? fadeUpReducedVariants : fadeUpVariants;
  const animateProps = whileInView
    ? { whileInView: "visible", viewport: { once: true, amount: 0.3 } }
    : { animate: "visible" };

  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={variants}
      transition={{ ...fadeUpTransition, delay }}
      {...animateProps}
    >
      {children}
    </motion.div>
  );
}
