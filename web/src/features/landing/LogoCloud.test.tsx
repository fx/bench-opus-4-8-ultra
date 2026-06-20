import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const reducedRef = { value: false };
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return { ...actual, useReducedMotionSafe: () => reducedRef.value };
});

import { LogoCloud } from "./LogoCloud.tsx";
import { LOGO_CLOUD, LOGO_CLOUD_HEADING } from "./content.ts";

describe("LogoCloud", () => {
  beforeEach(() => {
    reducedRef.value = false;
  });

  it("renders the heading and every wordmark with the edge-fade mask when motion is allowed", () => {
    const { container } = render(<LogoCloud />);
    expect(screen.getByText(LOGO_CLOUD_HEADING)).toBeInTheDocument();
    for (const name of LOGO_CLOUD) {
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    }
    // The fade mask is applied while the marquee scrolls.
    expect(container.querySelector('[class*="mask-image"]')).not.toBeNull();
  });

  it("drops the edge-fade mask under reduced motion so logos are not clipped", () => {
    reducedRef.value = true;
    const { container } = render(<LogoCloud />);
    for (const name of LOGO_CLOUD) {
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    }
    expect(container.querySelector('[class*="mask-image"]')).toBeNull();
  });
});
