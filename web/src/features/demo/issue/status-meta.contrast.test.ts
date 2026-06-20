import { describe, it, expect } from "vitest";
import { AGENT_BADGE_COLOR, STATUS_META } from "./status-meta.ts";
import type { Status } from "../data/types.ts";

// WCAG AA contrast guard for every hardcoded text-on-color introduced by the
// issue detail (0006), mirroring data/seed-contrast.test.ts. Two surfaces paint
// WHITE text on a brand colour:
//
//  - STATUS_META[*].color  → white status lozenge (StatusDropdown trigger)
//  - the activity "Rovo" agent badge → white on #6554C0 (ActivityFeed)
//
// Each MUST clear AA for white text (≥ 4.5:1). The ratios are recomputed here, so
// any future edit that lightens a status colour (or the agent-badge violet)
// below AA fails CI instead of shipping a contrast bug.

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

// The text-on-color surfaces 0006 introduces, tagged by source so a failure
// points at the exact element.
interface TextOnColor {
  source: string;
  color: string;
}

function textBearingColors(): TextOnColor[] {
  const rows: TextOnColor[] = [];
  for (const status of Object.keys(STATUS_META) as Status[]) {
    rows.push({
      source: `status lozenge ${status}`,
      color: STATUS_META[status].color,
    });
  }
  // The ActivityFeed "Rovo" agent badge: white text on AGENT_BADGE_COLOR. The
  // SAME exported constant the component renders, so the guarded value and the
  // rendered value can't drift.
  rows.push({ source: "activity agent badge", color: AGENT_BADGE_COLOR });
  return rows;
}

describe("every text-bearing 0006 colour meets WCAG AA", () => {
  it("collects the expected number of colours to guard", () => {
    // 4 statuses + 1 agent badge = 5. Guards against the iteration silently
    // passing if a colour source is dropped.
    expect(textBearingColors()).toHaveLength(5);
  });

  it.each(textBearingColors())(
    "$source ($color) clears AA for white text",
    ({ color }) => {
      expect(contrast(WHITE, hexToRgb(color))).toBeGreaterThanOrEqual(
        AA_NORMAL,
      );
    },
  );
});
