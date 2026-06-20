import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { FadeUp, useReducedMotionSafe } from "../../components/motion/index.ts";
import { Section } from "./Section.tsx";
import { HOW_IT_WORKS } from "./content.ts";

// "How it works": three numbered steps connected by a vertical line that draws
// itself as the section scrolls through the viewport. Under reduced motion the
// line is rendered fully drawn (scaleY 1) with no scroll-linked animation.
export function HowItWorks() {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  // Track this section's progress through the viewport (0 → 1).
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  // Smooth the raw progress so the draw feels organic rather than jittery.
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Three steps to total abdication"
      lede="From a vague feeling to fully autonomous revenue, with you nowhere in the loop."
    >
      <div ref={ref} className="relative mx-auto max-w-3xl">
        {/* The connecting line: a static track with a drawn overlay. */}
        <div
          aria-hidden="true"
          className="absolute left-[1.35rem] top-4 bottom-4 w-px bg-border sm:left-1/2"
        >
          <motion.div
            data-testid="howitworks-line"
            data-reduced={reduced.toString()}
            className="h-full w-px origin-top bg-primary"
            style={reduced ? { scaleY: 1 } : { scaleY }}
          />
        </div>

        <ol className="space-y-12">
          {HOW_IT_WORKS.map((step) => (
            <li key={step.numeral} className="relative">
              <FadeUp className="flex items-start gap-5 sm:gap-8">
                <span className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-card font-mono text-sm font-semibold text-primary-text">
                  {step.numeral}
                </span>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </FadeUp>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
