import {
  Marquee,
  useReducedMotionSafe,
} from "../../components/motion/index.ts";
import { cn } from "../../lib/cn.ts";
import { LOGO_CLOUD, LOGO_CLOUD_HEADING } from "./content.ts";

// Social-proof band: a heading over a marquee of fictional company wordmarks.
// Each "logo" is a locally-rendered text mark (no external/CDN asset). The
// Marquee primitive handles the seamless loop and the reduced-motion fallback.
export function LogoCloud() {
  const reduced = useReducedMotionSafe();
  return (
    <section className="border-y bg-panel/30 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {LOGO_CLOUD_HEADING}
        </p>
        <Marquee
          durationSeconds={36}
          // The edge-fade mask only makes sense while the row scrolls. Under
          // reduced motion the row is static, so drop the mask to avoid fading
          // the first/last logos into invisibility.
          className={cn(
            !reduced &&
              "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
          )}
        >
          {LOGO_CLOUD.map((name) => (
            <span
              key={name}
              className="mx-8 whitespace-nowrap text-lg font-semibold tracking-tight text-muted-foreground/80"
            >
              {name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
