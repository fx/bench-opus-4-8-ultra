import { describe, it, expect } from "vitest";
import { createSeed } from "./seed.ts";

// COMPREHENSIVE WCAG AA contrast guard for every hardcoded demo colour that
// bears text. Several demo surfaces paint text on a seed-defined brand colour:
//
//  - user.avatarColor    → WHITE initials (board AssigneeAvatar, issue detail)
//  - project.avatarColor → WHITE key      (sidebar project avatar)
//  - epic.color          → WHITE lozenge  (board Card epic lozenge)
//
// All of those use white text, so each colour MUST clear AA (white-on-color ≥
// 4.5:1). This test pulls the colours straight from the LIVE seed (createSeed)
// and asserts the ratio for EACH, so any future avatar/epic/project colour added
// with too light a value fails CI here instead of shipping a contrast bug.
//
// Decorative-only colours that render NO text are exempt — and there currently
// are none in the seed (the only colours are the three text-bearing groups
// above). The agent-avatar focus ring (#6554C0 in CardMeta) is a border, not a
// text background, so it carries no text-contrast requirement.

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

// One row per text-bearing colour in the seed, tagged with a readable source so
// a failure points at the exact element. Built from the live seed so new
// avatars/epics are covered automatically.
interface TextOnColor {
  source: string;
  color: string;
  text: [number, number, number];
}

function textBearingColors(): TextOnColor[] {
  const seed = createSeed();
  const rows: TextOnColor[] = [];

  // Project avatar (sidebar) — white key on project.avatarColor.
  rows.push({
    source: `project ${seed.project.key} avatar`,
    color: seed.project.avatarColor,
    text: WHITE,
  });

  // Every user avatar — white initials on user.avatarColor.
  for (const user of seed.users) {
    rows.push({
      source: `${user.initials} avatar`,
      color: user.avatarColor,
      text: WHITE,
    });
  }

  // Every distinct epic colour — white lozenge text on epic.color.
  const seenEpics = new Map<string, string>();
  for (const issue of seed.issues) {
    if (issue.epic) {
      seenEpics.set(issue.epic.color, issue.epic.name);
    }
  }
  for (const [color, name] of seenEpics) {
    rows.push({ source: `epic ${name}`, color, text: WHITE });
  }

  return rows;
}

describe("every text-bearing seed colour meets WCAG AA", () => {
  it("collects a non-trivial set of colours to guard", () => {
    // Guard against the iteration silently passing if the seed loses its
    // colours (project + 6 users + 3 epics = 10 at time of writing).
    expect(textBearingColors().length).toBeGreaterThanOrEqual(10);
  });

  it.each(textBearingColors())(
    "$source ($color) clears AA for its text",
    ({ color, text }) => {
      expect(contrast(text, hexToRgb(color))).toBeGreaterThanOrEqual(AA_NORMAL);
    },
  );
});
