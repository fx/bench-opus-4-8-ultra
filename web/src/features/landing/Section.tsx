import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

// A consistent vertical section wrapper with the shared max-width container and
// responsive padding, used by the marketing sections so spacing/rhythm is
// uniform. `id` enables the in-page anchor links; `eyebrow`/`title`/`lede`
// render an optional centered section header.

export interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className,
  containerClassName,
}: SectionProps) {
  return (
    <section id={id} className={cn("relative px-4 py-20 sm:py-28", className)}>
      <div className={cn("mx-auto max-w-6xl", containerClassName)}>
        {(eyebrow || title || lede) && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {eyebrow && (
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-text">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h2>
            )}
            {lede && (
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                {lede}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
