import { describe, it, expect } from "vitest";
import { createSeed } from "./seed.ts";

// WCAG AA contrast guard for the seed's hardcoded per-epic colours. Epic
// lozenges (board Card / issue detail) render WHITE text on the epic's brand
// colour, so every epic colour MUST clear AA (white-on-color ≥ 4.5:1). This
// iterates over EVERY epic colour found in the live seed, so a future epic added
// with too-light a colour fails CI here instead of shipping a contrast bug.
//
// Scope note: assignee/reporter avatar colours and the project avatar colour are
// intentionally NOT guarded — those avatars expose their identity via an
// aria-label ("Assignee: <name>"), so the white initials drawn on the coloured
// chip are decorative (not the accessible name) and are exempt from text
// contrast. Label lozenges render text-muted-foreground on bg-panel and are
// guarded in styles/jira-contrast.test.ts. Epic colours are the only seed hexes
// that carry real foreground text.

const WHITE: [number, number, number] = [255, 255, 255];
const AA_NORMAL = 4.5;

// "#RRGGBB" → [r, g, b] 0-255.
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// WCAG relative luminance and contrast ratio.
function channel(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}
function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Collect the distinct epic colours used across the seeded issues, plus their
// names for readable failure messages.
function seedEpicColors(): { name: string; color: string }[] {
  const seen = new Map<string, string>();
  for (const issue of createSeed().issues) {
    if (issue.epic) {
      seen.set(issue.epic.color, issue.epic.name);
    }
  }
  return [...seen].map(([color, name]) => ({ name, color }));
}

describe("seed epic colors meet WCAG AA for white lozenge text", () => {
  it("has at least one epic colour to check", () => {
    // Guard against the iteration silently passing if the seed loses all epics.
    expect(seedEpicColors().length).toBeGreaterThan(0);
  });

  it.each(seedEpicColors())(
    "white text on the $name epic ($color) clears AA",
    ({ color }) => {
      expect(contrast(WHITE, hexToRgb(color))).toBeGreaterThanOrEqual(
        AA_NORMAL,
      );
    },
  );
});
