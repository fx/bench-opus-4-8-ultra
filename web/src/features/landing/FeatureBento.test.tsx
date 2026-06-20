import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureBento } from "./FeatureBento.tsx";
import { FEATURES } from "./content.ts";

describe("FeatureBento", () => {
  it("renders every feature tile with its name, description, and icon", () => {
    const { container } = render(<FeatureBento />);
    for (const feature of FEATURES) {
      expect(
        screen.getByRole("heading", { name: feature.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(feature.description)).toBeInTheDocument();
    }
    // Each tile resolves a lucide icon to an <svg>; there is one per feature
    // (icons are aria-hidden).
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(
      FEATURES.length,
    );
  });

  it("applies the wide and tall span classes for the asymmetric grid", () => {
    const { container } = render(<FeatureBento />);
    expect(container.querySelector(".sm\\:col-span-2")).not.toBeNull();
    expect(container.querySelector(".sm\\:row-span-2")).not.toBeNull();
  });
});
