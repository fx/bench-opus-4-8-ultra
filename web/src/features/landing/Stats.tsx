import { useRef } from "react";
import { useInView } from "motion/react";
import { CountUp, FadeUp, Stagger } from "../../components/motion/index.ts";
import { Section } from "./Section.tsx";
import { STATS } from "./content.ts";

// Metrics band: absurd stats that count up the first time the band scrolls into
// view. `useInView(once)` gates mounting the CountUp counters so the animation
// fires exactly once on view rather than on initial render (off-screen).
// CountUp itself short-circuits to the final value under reduced motion.
export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <Section className="border-y bg-panel/30">
      <div
        ref={ref}
        data-testid="stats-band"
        data-inview={inView.toString()}
        className="grid grid-cols-2 gap-8 text-center sm:grid-cols-3 lg:grid-cols-6"
      >
        <Stagger className="contents">
          {STATS.map((stat) => (
            <FadeUp key={stat.label} className="flex flex-col items-center">
              <span className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {inView ? (
                  <CountUp
                    to={stat.value}
                    decimals={stat.decimals ?? 0}
                    prefix={stat.prefix ?? ""}
                    suffix={stat.suffix ?? ""}
                  />
                ) : (
                  <span>
                    {stat.prefix ?? ""}
                    {stat.value.toFixed(stat.decimals ?? 0)}
                    {stat.suffix ?? ""}
                  </span>
                )}
              </span>
              <span className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </span>
            </FadeUp>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
