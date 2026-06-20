import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const reducedRef = { value: false };
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return { ...actual, useReducedMotionSafe: () => reducedRef.value };
});

import { HowItWorks } from "./HowItWorks.tsx";
import { HOW_IT_WORKS } from "./content.ts";

describe("HowItWorks", () => {
  beforeEach(() => {
    reducedRef.value = false;
  });

  it("renders the three numbered steps with titles and descriptions", () => {
    render(<HowItWorks />);
    for (const step of HOW_IT_WORKS) {
      expect(screen.getByText(step.numeral)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: step.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(step.description)).toBeInTheDocument();
    }
  });

  it("uses a scroll-linked drawn line when motion is allowed", () => {
    render(<HowItWorks />);
    const line = screen.getByTestId("howitworks-line");
    expect(line).toHaveAttribute("data-reduced", "false");
  });

  it("renders the line fully drawn under reduced motion", () => {
    reducedRef.value = true;
    render(<HowItWorks />);
    const line = screen.getByTestId("howitworks-line");
    // Reduced path pins scaleY to 1 (a static style object) and uses no
    // scroll-linked motion value; the data attribute reflects which branch ran.
    expect(line).toHaveAttribute("data-reduced", "true");
  });
});
