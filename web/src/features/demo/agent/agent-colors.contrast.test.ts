import { describe, it, expect } from "vitest";
import {
  AGENT_DONE_BANNER_BG,
  AGENT_DONE_COLOR,
  AGENT_PANEL_BG,
} from "./agent-colors.ts";

// WCAG AA contrast guard for the AgentPanel's hardcoded text-on-LIGHT colour
// (0007), mirroring the other contrast guards. Unlike the white-on-colour
// lozenges, the agent panel paints AGENT_DONE_COLOR AS TEXT on the near-white
// panel — and, for the done banner, on a 10% tint of that colour OVER the panel.
// Both the colour and that REAL effective background are recomputed here so any
// future lightening of the green below AA fails CI instead of shipping a
// contrast bug. The icon is decorative (aria-hidden) but shares the colour, so
// guarding the text covers it.

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

// Alpha-composite `fg` over `bg` at opacity `alpha` — reproduces a 10% tint, used
// to verify the precomputed banner-background constant matches a 10% green tint.
function composite(
  fg: [number, number, number],
  bg: [number, number, number],
  alpha: number,
): [number, number, number] {
  return [
    Math.round(alpha * fg[0] + (1 - alpha) * bg[0]),
    Math.round(alpha * fg[1] + (1 - alpha) * bg[1]),
    Math.round(alpha * fg[2] + (1 - alpha) * bg[2]),
  ];
}

describe("AgentPanel done colour meets WCAG AA on its real background", () => {
  const green = hexToRgb(AGENT_DONE_COLOR);
  const panel = hexToRgb(AGENT_PANEL_BG);
  const banner = hexToRgb(AGENT_DONE_BANNER_BG);

  it("clears AA as text directly on the panel (the per-step check)", () => {
    expect(contrast(green, panel)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("clears AA as text on the done banner background", () => {
    expect(contrast(green, banner)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("uses a banner background equal to a 10% green tint over the panel", () => {
    // The precomputed AGENT_DONE_BANNER_BG must equal compositing 10% green over
    // the panel — so the static hex can't silently drift from the intended tint.
    expect(banner).toEqual(composite(green, panel, 0.1));
  });
});
