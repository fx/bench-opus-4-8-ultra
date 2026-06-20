import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// WCAG AA contrast guard for the Jira theme tokens used by the demo chrome.
// The ultra-designer flagged two AA misses (the notification badge red and the
// subtle/breadcrumb text); these tokens were darkened to clear 4.5:1. This test
// parses the live values out of themes.css and recomputes the ratios so a future
// edit that lightens them back below AA fails CI instead of shipping.

// Vitest runs with cwd at the web/ package root, so resolve themes.css from
// there (import.meta.url is not a file: URL under the Vite transform).
const cssPath = resolve(process.cwd(), "src/styles/themes.css");
const css = readFileSync(cssPath, "utf8");

// Extract the [data-theme="jira"] { ... } block so we read the Jira values, not
// the marketing ones (both define the same token names).
function jiraBlock(): string {
  const start = css.indexOf('[data-theme="jira"]');
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

// Read an `--token: H S% L%` triplet from the Jira block as [h, s, l] numbers.
// Some tokens (e.g. --border) are emitted as a full `hsl(H S% L%)` color rather
// than a bare triplet, so an optional `hsl(` prefix is tolerated.
function token(name: string): [number, number, number] {
  const block = jiraBlock();
  const re = new RegExp(
    `--${name}:\\s*(?:hsl\\(\\s*)?([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`,
  );
  const m = block.match(re);
  if (!m) {
    throw new Error(`token --${name} not found in jira theme`);
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// hsl(h, s%, l%) → [r, g, b] 0-255, matching the CSS hsl() the browser renders.
function hslToRgb([h, s, l]: [number, number, number]): [
  number,
  number,
  number,
] {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) =>
    ln - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
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

const WHITE: [number, number, number] = [255, 255, 255];
const AA_NORMAL = 4.5;

describe("Jira theme WCAG AA contrast", () => {
  it("white text on the destructive surface (notification badge) clears AA", () => {
    const destructive = hslToRgb(token("destructive"));
    const ratio = contrast(WHITE, destructive);
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("muted/subtle text clears AA on the page background", () => {
    const muted = hslToRgb(token("muted-foreground"));
    const page = hslToRgb(token("page"));
    expect(contrast(muted, page)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("muted/subtle text clears AA on white card surfaces", () => {
    // muted-foreground is shared (e.g. sidebar/help text on white cards), so it
    // must also clear AA against the white --background, not only the page bg.
    const muted = hslToRgb(token("muted-foreground"));
    const background = hslToRgb(token("background"));
    expect(contrast(muted, background)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("primary body text remains well above AA on the page background", () => {
    // Guard the unchanged primary text token so the darkening edits didn't
    // accidentally disturb the main reading contrast.
    const foreground = hslToRgb(token("foreground"));
    const page = hslToRgb(token("page"));
    expect(contrast(foreground, page)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("the board column count badge text clears AA on its grey pill", () => {
    // The count pill (board Column) is bg-border (#E1E5EA) with text-foreground.
    // muted-foreground (#607085) on that darker grey is only ~4.0:1 (fails AA for
    // 12px/600 text), which is why the badge uses --foreground instead. Lock it:
    // if a future edit lightens the text token below AA on the pill, this fails.
    const foreground = hslToRgb(token("foreground"));
    const border = hslToRgb(token("border"));
    expect(contrast(foreground, border)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("muted lozenge text (points/labels) clears AA on the panel grey pill", () => {
    // The story-points badge and label lozenges use text-muted-foreground on
    // bg-panel (#F4F5F7). Unlike the count pill's darker #E1E5EA, panel is light
    // enough that muted-foreground clears AA — guard it so it stays that way.
    const muted = hslToRgb(token("muted-foreground"));
    const panel = hslToRgb(token("panel"));
    expect(contrast(muted, panel)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
