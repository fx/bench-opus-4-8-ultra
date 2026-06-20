import { describe, it, expect } from "vitest";
import * as motion from "./index.ts";

describe("motion barrel", () => {
  it("re-exports the public primitives and constants", () => {
    expect(motion.EASE_OUT).toBeDefined();
    expect(motion.EASE_IN_OUT).toBeDefined();
    expect(motion.DURATION).toBeDefined();
    expect(motion.fadeUpVariants).toBeDefined();
    expect(motion.fadeUpReducedVariants).toBeDefined();
    expect(motion.fadeUpTransition).toBeDefined();
    expect(motion.staggerContainerVariants).toBeDefined();
    expect(motion.useReducedMotionSafe).toBeInstanceOf(Function);
    expect(motion.FadeUp).toBeInstanceOf(Function);
    expect(motion.Stagger).toBeInstanceOf(Function);
    expect(motion.CountUp).toBeInstanceOf(Function);
    expect(motion.Marquee).toBeInstanceOf(Function);
  });
});
