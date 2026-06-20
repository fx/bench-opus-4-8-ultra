import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guard for the GLOBAL reduced-motion CSS rule (styles/globals.css). The app's
// JS `useReducedMotionSafe` hook only gates Motion's JS animations — CSS
// animations/transitions (the dialog's tailwindcss-animate enter/exit, and any
// future 0007 agent/autopilot CSS motion) are covered ONLY by this global
// `@media (prefers-reduced-motion: reduce)` rule. This test parses the live
// stylesheet (same approach as the contrast guards) and asserts the rule exists
// and collapses animation/transition durations to ~instant, so the accessibility
// guard can't be deleted silently. CSS isn't in the TS coverage include, so this
// doesn't affect the 100% thresholds.

// Vitest runs with cwd at the web/ package root.
const cssPath = resolve(process.cwd(), "src/styles/globals.css");
const css = readFileSync(cssPath, "utf8");

// Extract the body of the `@media (prefers-reduced-motion: reduce) { ... }`
// block. Brace-count from the media query's opening brace so a nested rule block
// (the `*, *::before, *::after { ... }` selector) is captured in full.
function reducedMotionBlock(): string {
  const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
  expect(start).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") {
      depth++;
    } else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        return css.slice(open + 1, i);
      }
    }
  }
  throw new Error("unterminated @media block");
}

describe("global reduced-motion CSS guard", () => {
  const block = reducedMotionBlock();

  it("targets all elements (universal + pseudo-elements)", () => {
    expect(block).toMatch(/\*\s*,\s*\*::before\s*,\s*\*::after/);
  });

  it("collapses animation and transition durations to ~instant with !important", () => {
    // Each property must be present, near-zero, and forced (!important) so it
    // overrides per-element utility durations (e.g. the dialog's `duration-200`).
    const nearZero = "0.01ms !important";
    for (const prop of [
      "animation-duration",
      "transition-duration",
      "animation-delay",
      "transition-delay",
    ]) {
      const re = new RegExp(`${prop}:\\s*${nearZero.replace(/\s+/g, "\\s*")}`);
      expect(block).toMatch(re);
    }
  });

  it("pins animation-iteration-count and disables smooth scrolling", () => {
    expect(block).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(block).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });
});
