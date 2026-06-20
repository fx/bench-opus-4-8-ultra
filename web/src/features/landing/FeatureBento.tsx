import type { LucideIcon } from "lucide-react";
import {
  Coins,
  Hammer,
  HeartPulse,
  Layers,
  Sparkles,
  TrendingUp,
  UserMinus,
  Workflow,
} from "lucide-react";
import { cn } from "../../lib/cn.ts";
import { FadeUp, Stagger } from "../../components/motion/index.ts";
import { Section } from "./Section.tsx";
import { FEATURES, type Feature } from "./content.ts";

// Maps the content module's icon names to concrete lucide components. Keeping the
// content as plain strings (not component refs) keeps content.ts free of JSX/icon
// imports and trivially testable; this map is the single resolution point.
const ICONS: Record<string, LucideIcon> = {
  Workflow,
  Sparkles,
  Coins,
  Hammer,
  HeartPulse,
  Layers,
  TrendingUp,
  UserMinus,
};

// Tailwind column/row spans per tile size, producing the asymmetric bento.
const SPAN_CLASS: Record<NonNullable<Feature["span"]>, string> = {
  wide: "sm:col-span-2",
  tall: "sm:row-span-2",
  normal: "",
};

function FeatureTile({ feature }: { feature: Feature }) {
  const Icon = ICONS[feature.icon];
  const span = SPAN_CLASS[feature.span ?? "normal"];
  return (
    <FadeUp
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card/60 p-6 transition-colors hover:border-primary/40",
        span,
      )}
    >
      <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-primary/10 text-primary-text">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">{feature.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {feature.description}
      </p>
    </FadeUp>
  );
}

// The feature bento: an asymmetric grid of parody "agentic" feature tiles, each
// with an icon, name, and one-liner. Tiles fade/stagger in on scroll.
export function FeatureBento() {
  return (
    <Section
      id="features"
      eyebrow="Capabilities"
      title="An entire org chart of agents, minus the org"
      lede="Every box a real SaaS would fill with a team, we fill with a tireless, opinionated agent."
    >
      <Stagger className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureTile key={feature.name} feature={feature} />
        ))}
      </Stagger>
    </Section>
  );
}
