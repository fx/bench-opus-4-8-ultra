import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button.tsx";
import { FadeUp } from "../../components/motion/index.ts";
import { AuroraMesh, DotGrid, GrainOverlay } from "./Backdrops.tsx";
import { Terminal, type TerminalClock } from "./Terminal.tsx";
import { HERO, TERMINAL_LINES } from "./content.ts";

export interface HeroProps {
  // Forwarded to the terminal mock so tests can drive its typewriter clock.
  terminalClock?: TerminalClock;
}

// The hero: aurora/grain/dot-grid backdrop, eyebrow pill, parody tagline,
// subhead, dual CTA (primary "Deploy your first agent" + secondary "Watch the
// slop ▶" routing to /demo), and the animated terminal product mock.
export function Hero({ terminalClock }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:pt-28">
      <AuroraMesh />
      <DotGrid />
      <GrainOverlay />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <FadeUp whileInView={false} className="text-center lg:text-left">
          <span className="inline-flex items-center rounded-full border bg-panel/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            {HERO.eyebrow}
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            {HERO.tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0">
            {HERO.subhead}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/demo">{HERO.primaryCta}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link to="/demo">{HERO.secondaryCta}</Link>
            </Button>
          </div>
        </FadeUp>

        <FadeUp whileInView={false} delay={0.15}>
          <Terminal lines={TERMINAL_LINES} clock={terminalClock} />
        </FadeUp>
      </div>
    </section>
  );
}
