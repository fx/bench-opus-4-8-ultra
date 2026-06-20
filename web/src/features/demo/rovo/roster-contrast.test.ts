import { describe, it, expect } from "vitest";
import { ROSTER_AGENTS } from "./roster.ts";

// WCAG AA contrast guard for the Rovo Agents roster (0007), mirroring
// data/seed-contrast.test.ts. Each agent avatar paints WHITE initials on its
// `avatarColor`, so EVERY avatarColor MUST clear AA for white text (≥ 4.5:1). The
// ratios are recomputed here straight from the roster data, so any future agent
// added with too light an avatar colour fails CI instead of shipping a contrast
// bug. The utilization/shipped badges use theme tokens (dark text on a light
// tint), NOT white-on-color, so they carry no hardcoded-contrast requirement.

const WHITE: [number, number, number] = [255, 255, 255];
const AA_NORMAL = 4.5;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

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

describe("every roster agent avatar colour meets WCAG AA", () => {
  it("guards a non-trivial set of agents", () => {
    expect(ROSTER_AGENTS.length).toBeGreaterThanOrEqual(6);
  });

  it.each(ROSTER_AGENTS)(
    "$name ($avatarColor) clears AA for white initials",
    ({ avatarColor }) => {
      expect(contrast(WHITE, hexToRgb(avatarColor))).toBeGreaterThanOrEqual(
        AA_NORMAL,
      );
    },
  );

  it("has unique agent ids (used as React list keys)", () => {
    const ids = ROSTER_AGENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
