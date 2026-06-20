import { ANNUAL_MONTHS_BILLED, type PricingTier } from "./content.ts";

export type BillingPeriod = "monthly" | "annual";

// A resolved, render-ready price for a tier under a billing period.
export interface DisplayPrice {
  // The big displayed amount, e.g. "$99", "Free", "Talk to an agent".
  amount: string;
  // The unit/period suffix, e.g. "/mo" — null for custom-label tiers.
  period: string | null;
  // Secondary note, e.g. annual savings — null when not applicable.
  note: string | null;
}

// computeDisplayPrice derives what to render for a tier given the billing toggle.
// Tiers with a custom `priceLabel` (Free, "Talk to an agent") render that label
// verbatim with no period/note. Numeric tiers show the per-month rate; under
// annual billing the effective monthly rate is the annual total divided over 12
// months, and the note advertises the two-months-free saving baked into the
// ANNUAL_MONTHS_BILLED constant.
export function computeDisplayPrice(
  tier: PricingTier,
  period: BillingPeriod,
): DisplayPrice {
  if (tier.priceLabel) {
    return { amount: tier.priceLabel, period: null, note: null };
  }

  // Numeric tiers have both prices populated (a tier either has a priceLabel or
  // real numbers). Fall back to 0 rather than asserting non-null so a
  // mis-authored tier degrades to "$0" instead of rendering NaN or crashing.
  const monthly = tier.priceMonthly ?? 0;
  const annualTotal = tier.priceAnnual ?? 0;

  if (period === "monthly") {
    return { amount: `$${monthly}`, period: "/mo", note: null };
  }

  // Annual: show effective monthly rate (annual total spread over 12 months).
  const effectiveMonthly = Math.round(annualTotal / 12);
  const monthsFree = 12 - ANNUAL_MONTHS_BILLED;
  return {
    amount: `$${effectiveMonthly}`,
    period: "/mo",
    note: `billed $${annualTotal}/yr · ${monthsFree} months free`,
  };
}
