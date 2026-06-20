import { cn } from "../../lib/cn.ts";
import { useReducedMotionSafe } from "../../components/motion/index.ts";

// Shared marketing-theme backdrop treatments. These are purely decorative
// (aria-hidden) and sit behind content. Under reduced motion the aurora's
// infinite drift animation is dropped — the mesh is still rendered, just static.

export interface BackdropProps {
  className?: string;
}

// AuroraMesh paints soft, overlapping violet/chartreuse radial blobs that drift
// continuously to evoke the gradient-soaked AI-SaaS hero. The drift uses a CSS
// animation gated off under reduced motion (data-animated reflects the state).
export function AuroraMesh({ className }: BackdropProps) {
  const reduced = useReducedMotionSafe();
  return (
    <div
      aria-hidden="true"
      data-testid="aurora-mesh"
      data-animated={(!reduced).toString()}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full bg-primary/30 blur-[120px]",
          !reduced && "animate-aurora-drift",
        )}
      />
      <div
        className={cn(
          "absolute -right-1/4 top-1/3 h-[55vh] w-[55vh] rounded-full bg-slop/20 blur-[120px]",
          !reduced && "animate-aurora-drift-slow",
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-1/3 h-[50vh] w-[50vh] rounded-full bg-primary/20 blur-[120px]",
          !reduced && "animate-aurora-drift",
        )}
      />
    </div>
  );
}

// GrainOverlay lays a faint SVG fractal-noise texture over a section so flat
// gradients read as premium film grain rather than banding. Static; no motion.
export function GrainOverlay({ className }: BackdropProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="grain-overlay"
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-soft-light",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

// DotGrid renders a subtle dotted lattice via a repeating radial-gradient. Used
// behind the hero and section bands for depth. Static; no motion.
export function DotGrid({ className }: BackdropProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="dot-grid"
      className={cn(
        "pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(hsl(var(--foreground) / 0.12) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}
