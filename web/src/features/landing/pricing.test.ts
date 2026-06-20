import { describe, it, expect } from "vitest";
import { computeDisplayPrice } from "./pricing.ts";
import type { PricingTier } from "./content.ts";

const numericTier: PricingTier = {
  name: "Pro Agentic",
  priceMonthly: 99,
  priceAnnual: 990,
  blurb: "blurb",
  features: ["a"],
  cta: "go",
  popular: true,
};

const labelTier: PricingTier = {
  name: "Enterprise Singularity",
  priceMonthly: null,
  priceAnnual: null,
  priceLabel: "Talk to an agent",
  blurb: "blurb",
  features: ["a"],
  cta: "go",
};

const freeTier: PricingTier = {
  name: "Hobby Slop",
  priceMonthly: 0,
  priceAnnual: 0,
  priceLabel: "Free",
  blurb: "blurb",
  features: ["a"],
  cta: "go",
};

describe("computeDisplayPrice", () => {
  it("renders a custom-label tier verbatim with no period or note", () => {
    expect(computeDisplayPrice(labelTier, "monthly")).toEqual({
      amount: "Talk to an agent",
      period: null,
      note: null,
    });
    // Period does not affect a label tier.
    expect(computeDisplayPrice(labelTier, "annual")).toEqual({
      amount: "Talk to an agent",
      period: null,
      note: null,
    });
    expect(computeDisplayPrice(freeTier, "monthly").amount).toBe("Free");
  });

  it("shows the monthly rate with /mo and no note under monthly billing", () => {
    expect(computeDisplayPrice(numericTier, "monthly")).toEqual({
      amount: "$99",
      period: "/mo",
      note: null,
    });
  });

  it("shows the effective monthly rate and savings note under annual billing", () => {
    // 990 / 12 = 82.5 → rounds to 83; 12 - 10 months billed = 2 months free.
    expect(computeDisplayPrice(numericTier, "annual")).toEqual({
      amount: "$83",
      period: "/mo",
      note: "billed $990/yr · 2 months free",
    });
  });

  it("degrades to $0 when a non-label tier is mis-authored with null prices", () => {
    // Defensive: a tier without a priceLabel that also lacks numeric prices
    // should render $0 rather than NaN or crash (exercises the ?? 0 fallback).
    const malformed: PricingTier = {
      name: "Broken",
      priceMonthly: null,
      priceAnnual: null,
      blurb: "blurb",
      features: ["a"],
      cta: "go",
    };
    expect(computeDisplayPrice(malformed, "monthly")).toEqual({
      amount: "$0",
      period: "/mo",
      note: null,
    });
    expect(computeDisplayPrice(malformed, "annual")).toEqual({
      amount: "$0",
      period: "/mo",
      note: "billed $0/yr · 2 months free",
    });
  });
});
