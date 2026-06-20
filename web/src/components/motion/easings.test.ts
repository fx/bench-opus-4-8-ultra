import { describe, it, expect } from "vitest";
import {
  EASE_OUT,
  EASE_IN_OUT,
  DURATION,
  fadeUpVariants,
  fadeUpReducedVariants,
  fadeUpTransition,
  staggerContainerVariants,
} from "./easings.ts";

describe("easings", () => {
  it("exposes the shared ease-out curve", () => {
    expect(EASE_OUT).toEqual([0.22, 1, 0.36, 1]);
  });

  it("exposes a symmetric ease-in-out curve", () => {
    expect(EASE_IN_OUT).toEqual([0.65, 0, 0.35, 1]);
  });

  it("exposes duration tokens", () => {
    expect(DURATION.fast).toBeLessThan(DURATION.base);
    expect(DURATION.base).toBeLessThan(DURATION.slow);
  });

  it("fade-up variant translates and fades", () => {
    expect(fadeUpVariants.hidden).toEqual({ opacity: 0, y: 24 });
    expect(fadeUpVariants.visible).toEqual({ opacity: 1, y: 0 });
  });

  it("reduced fade-up variant has no translate", () => {
    expect(fadeUpReducedVariants.hidden).toEqual({ opacity: 0 });
    expect(fadeUpReducedVariants.visible).toEqual({ opacity: 1 });
  });

  it("fade-up transition uses the shared ease-out", () => {
    expect(fadeUpTransition.ease).toBe(EASE_OUT);
    expect(fadeUpTransition.duration).toBe(DURATION.base);
  });

  it("stagger container declares staggerChildren", () => {
    const visible = staggerContainerVariants.visible as {
      transition: { staggerChildren: number };
    };
    expect(visible.transition.staggerChildren).toBe(0.08);
  });
});
