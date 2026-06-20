import { describe, it, expect } from "vitest";
import {
  ANNOUNCEMENT,
  ANNUAL_MONTHS_BILLED,
  BIG_CTA,
  FAQ,
  FEATURES,
  FOOTER_COLUMNS,
  FOOTER_FINE_PRINT,
  FOOTER_GHOST_WORDMARK,
  FOOTER_SOCIALS,
  FOOTER_STATUS,
  HERO,
  HOW_IT_WORKS,
  LOGO_CLOUD,
  LOGO_CLOUD_HEADING,
  NAV_LINKS,
  PRICING,
  STATS,
  TERMINAL_LINES,
  TESTIMONIALS,
  WORDMARK,
} from "./content.ts";

// The content module is the single source of truth for all copy/data. These
// tests assert structural invariants and pin the canonical parody strings so any
// drift (or placeholder creep) fails the build.

const PLACEHOLDER = /lorem ipsum|todo|tbd|placeholder|xxx/i;

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(allStrings);
  }
  return [];
}

describe("landing content", () => {
  it("pins the brand wordmark and canonical hero copy", () => {
    expect(WORDMARK).toBe("Slop Simulator");
    expect(HERO.tagline).toBe(
      "The world's first fully autonomous slop engine.",
    );
    expect(HERO.eyebrow).toContain("multi-agent slopflows");
    expect(HERO.primaryCta).toBe("Deploy your first agent");
    expect(HERO.secondaryCta).toBe("Watch the slop ▶");
    expect(HERO.subhead).toContain("swarm of reasoning agents");
    expect(ANNOUNCEMENT).toContain("Series Slop");
  });

  it("provides scripted terminal lines", () => {
    expect(TERMINAL_LINES.length).toBeGreaterThan(0);
    expect(TERMINAL_LINES[0]).toContain("slop deploy");
  });

  it("provides four in-page nav links with hash anchors", () => {
    expect(NAV_LINKS.map((l) => l.label)).toEqual([
      "Features",
      "How it works",
      "Pricing",
      "FAQ",
    ]);
    for (const link of NAV_LINKS) {
      expect(link.href.startsWith("#")).toBe(true);
    }
  });

  it("provides a logo cloud heading and multiple wordmarks", () => {
    expect(LOGO_CLOUD_HEADING).toContain("Trusted by");
    expect(LOGO_CLOUD.length).toBeGreaterThanOrEqual(6);
    expect(LOGO_CLOUD).toContain("Synergy.ai");
  });

  it("provides 6–8 features with valid spans", () => {
    expect(FEATURES.length).toBeGreaterThanOrEqual(6);
    expect(FEATURES.length).toBeLessThanOrEqual(8);
    for (const feature of FEATURES) {
      expect(feature.icon).toBeTruthy();
      expect(feature.name).toBeTruthy();
      expect(feature.description).toBeTruthy();
      if (feature.span) {
        expect(["wide", "tall", "normal"]).toContain(feature.span);
      }
    }
    expect(FEATURES.map((f) => f.name)).toContain("Human-out-of-the-Loop Mode");
  });

  it("provides three how-it-works steps with numerals", () => {
    expect(HOW_IT_WORKS).toHaveLength(3);
    expect(HOW_IT_WORKS.map((s) => s.numeral)).toEqual(["01", "02", "03"]);
  });

  it("provides six absurd stats", () => {
    expect(STATS).toHaveLength(6);
    const developers = STATS.find((s) => s.label === "developers required");
    expect(developers?.value).toBe(0);
    const uptime = STATS.find((s) => s.label === "agent uptime");
    expect(uptime?.value).toBe(99.99);
    expect(uptime?.decimals).toBe(2);
  });

  it("provides four parody testimonials with initials", () => {
    expect(TESTIMONIALS).toHaveLength(4);
    expect(TESTIMONIALS.map((t) => t.name)).toContain("Brock Tensor");
    for (const t of TESTIMONIALS) {
      expect(t.initials).toHaveLength(2);
    }
  });

  it("provides three pricing tiers with the middle one popular", () => {
    expect(PRICING).toHaveLength(3);
    expect(PRICING[1].popular).toBe(true);
    expect(PRICING[0].priceLabel).toBe("Free");
    expect(PRICING[2].priceLabel).toBe("Talk to an agent");
    // Pro tier has real numeric prices.
    expect(PRICING[1].priceMonthly).toBe(99);
    expect(PRICING[1].priceAnnual).toBe(990);
    expect(ANNUAL_MONTHS_BILLED).toBe(10);
  });

  it("provides six FAQ items", () => {
    expect(FAQ).toHaveLength(6);
    expect(FAQ[0].question).toBe("Is the slop actually any good?");
    for (const item of FAQ) {
      expect(item.answer.length).toBeGreaterThan(20);
    }
  });

  it("provides the big CTA copy", () => {
    expect(BIG_CTA.headline).toContain("slop");
    expect(BIG_CTA.cta).toBeTruthy();
  });

  it("provides footer columns, status, ghost wordmark, socials, fine print", () => {
    expect(FOOTER_COLUMNS.length).toBeGreaterThanOrEqual(3);
    expect(FOOTER_STATUS).toContain("All agents operational");
    expect(FOOTER_GHOST_WORDMARK).toBe("SLOP");
    expect(FOOTER_SOCIALS.length).toBeGreaterThan(0);
    expect(FOOTER_FINE_PRINT).toContain("No humans were consulted");
  });

  it("contains zero placeholder strings anywhere", () => {
    const everything = [
      ANNOUNCEMENT,
      ...allStrings(HERO),
      ...TERMINAL_LINES,
      ...allStrings(NAV_LINKS),
      LOGO_CLOUD_HEADING,
      ...LOGO_CLOUD,
      ...allStrings(FEATURES),
      ...allStrings(HOW_IT_WORKS),
      ...allStrings(STATS),
      ...allStrings(TESTIMONIALS),
      ...allStrings(PRICING),
      ...allStrings(FAQ),
      ...allStrings(BIG_CTA),
      ...allStrings(FOOTER_COLUMNS),
      FOOTER_STATUS,
      FOOTER_GHOST_WORDMARK,
      FOOTER_FINE_PRINT,
      ...FOOTER_SOCIALS,
    ];
    for (const str of everything) {
      expect(str).not.toMatch(PLACEHOLDER);
      expect(str.trim().length).toBeGreaterThan(0);
    }
  });
});
