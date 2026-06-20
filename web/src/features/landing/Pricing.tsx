import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../components/ui/button.tsx";
import { Switch } from "../../components/ui/switch.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { cn } from "../../lib/cn.ts";
import {
  FadeUp,
  Stagger,
  useReducedMotionSafe,
} from "../../components/motion/index.ts";
import { Section } from "./Section.tsx";
import { PRICING, type PricingTier } from "./content.ts";
import { computeDisplayPrice, type BillingPeriod } from "./pricing.ts";

function TierCard({
  tier,
  period,
  reduced,
}: {
  tier: PricingTier;
  period: BillingPeriod;
  reduced: boolean;
}) {
  const price = computeDisplayPrice(tier, period);
  return (
    <FadeUp
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card/60 p-6",
        tier.popular &&
          "border-primary/60 bg-card shadow-[0_0_0_1px_hsl(var(--primary)/0.4)] lg:scale-[1.04]",
      )}
    >
      {tier.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most popular
        </Badge>
      )}
      <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>

      <div className="mt-6 flex items-end gap-1">
        {/* Animate the amount swapping when the toggle flips (unless reduced). */}
        <motion.span
          key={`${tier.name}-${price.amount}`}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-4xl font-semibold tracking-tight text-foreground"
        >
          {price.amount}
        </motion.span>
        {price.period && (
          <span className="pb-1 text-sm text-muted-foreground">
            {price.period}
          </span>
        )}
      </div>
      <p className="mt-1 h-4 text-xs text-primary-text">{price.note ?? ""}</p>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-primary-text"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className="mt-8 min-h-11 w-full"
        variant={tier.popular ? "default" : "outline"}
      >
        <Link to="/demo">{tier.cta}</Link>
      </Button>
    </FadeUp>
  );
}

// Pricing: three tiers with a monthly/annual billing toggle. The displayed price
// is derived from tier data by computeDisplayPrice; the middle tier is marked
// "Most popular" and visually elevated. The toggle and price swap animate
// (disabled under reduced motion).
export function Pricing() {
  const reduced = useReducedMotionSafe();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const annual = period === "annual";

  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="Plans that scale with your abdication"
      lede="Every plan is fully autonomous. The only thing you manage is the invoice."
    >
      <div className="mb-10 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-sm",
            annual ? "text-muted-foreground" : "text-foreground",
          )}
        >
          Monthly
        </span>
        <Switch
          checked={annual}
          onCheckedChange={(checked) =>
            setPeriod(checked ? "annual" : "monthly")
          }
          aria-label="Toggle annual billing"
        />
        <span
          className={cn(
            "text-sm",
            annual ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Annual
          <span className="ml-1.5 rounded-full bg-slop/15 px-2 py-0.5 text-xs font-medium text-slop">
            2 months free
          </span>
        </span>
      </div>

      <Stagger className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        {PRICING.map((tier) => (
          <TierCard
            key={tier.name}
            tier={tier}
            period={period}
            reduced={reduced}
          />
        ))}
      </Stagger>
    </Section>
  );
}
