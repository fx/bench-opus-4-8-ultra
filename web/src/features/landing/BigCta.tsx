import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button.tsx";
import { FadeUp } from "../../components/motion/index.ts";
import { AuroraMesh, GrainOverlay } from "./Backdrops.tsx";
import { BIG_CTA } from "./content.ts";

// Big closing CTA: a full-bleed aurora panel with one bold line and a single
// button that routes to the demo (client-side).
export function BigCta() {
  return (
    <section className="px-4 py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-card px-6 py-20 text-center sm:py-28">
        <AuroraMesh />
        <GrainOverlay />
        <FadeUp className="relative mx-auto max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {BIG_CTA.headline}
          </h2>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="min-h-11">
              <Link to="/demo">{BIG_CTA.cta}</Link>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
