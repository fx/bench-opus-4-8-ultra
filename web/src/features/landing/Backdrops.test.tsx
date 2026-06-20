import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const reducedRef = { value: false };
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return { ...actual, useReducedMotionSafe: () => reducedRef.value };
});

import { AuroraMesh, DotGrid, GrainOverlay } from "./Backdrops.tsx";

describe("Backdrops", () => {
  beforeEach(() => {
    reducedRef.value = false;
  });

  it("animates the aurora mesh and runs drift animations when motion is allowed", () => {
    const { container } = render(<AuroraMesh className="custom" />);
    const mesh = screen.getByTestId("aurora-mesh");
    expect(mesh).toHaveAttribute("data-animated", "true");
    expect(mesh).toHaveClass("custom");
    // At least one blob carries the drift animation class.
    expect(container.querySelector(".animate-aurora-drift")).not.toBeNull();
  });

  it("drops the drift animation under reduced motion but still renders the mesh", () => {
    reducedRef.value = true;
    const { container } = render(<AuroraMesh />);
    const mesh = screen.getByTestId("aurora-mesh");
    expect(mesh).toHaveAttribute("data-animated", "false");
    expect(container.querySelector(".animate-aurora-drift")).toBeNull();
    expect(container.querySelector(".animate-aurora-drift-slow")).toBeNull();
  });

  it("renders the static grain overlay", () => {
    render(<GrainOverlay className="grain-extra" />);
    const grain = screen.getByTestId("grain-overlay");
    expect(grain).toHaveClass("grain-extra");
    expect(grain).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the static dot grid", () => {
    render(<DotGrid className="grid-extra" />);
    const grid = screen.getByTestId("dot-grid");
    expect(grid).toHaveClass("grid-extra");
    expect(grid).toHaveAttribute("aria-hidden", "true");
  });
});
