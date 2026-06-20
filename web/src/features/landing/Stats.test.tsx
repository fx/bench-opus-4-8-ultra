import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Control useInView so both the pre-view (static placeholder) and in-view
// (CountUp) branches are exercised deterministically.
const inViewRef = { value: false };
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useInView: () => inViewRef.value };
});

// Stub CountUp to render its resolved final value (prefix + value + suffix) so
// the in-view branch is deterministic without driving an animation clock here —
// CountUp's own animation/reduced-motion behavior is covered in its unit test.
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return {
    ...actual,
    CountUp: ({
      to,
      decimals = 0,
      prefix = "",
      suffix = "",
    }: {
      to: number;
      decimals?: number;
      prefix?: string;
      suffix?: string;
    }) => (
      <span data-testid="countup">
        {prefix}
        {to.toFixed(decimals)}
        {suffix}
      </span>
    ),
  };
});

import { Stats } from "./Stats.tsx";
import { STATS } from "./content.ts";

describe("Stats", () => {
  beforeEach(() => {
    inViewRef.value = false;
  });

  it("renders static formatted values before the band scrolls into view", () => {
    render(<Stats />);
    const band = screen.getByTestId("stats-band");
    expect(band).toHaveAttribute("data-inview", "false");
    // No CountUp mounted yet — the static placeholder spans render instead.
    expect(screen.queryByTestId("countup")).not.toBeInTheDocument();
    // The 99.99% stat renders with two decimals + suffix in the placeholder.
    expect(band).toHaveTextContent("99.99%");
    // The <50ms stat renders its prefix.
    expect(band).toHaveTextContent("<50ms");
    for (const stat of STATS) {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });

  it("mounts CountUp counters once the band is in view", () => {
    inViewRef.value = true;
    render(<Stats />);
    const band = screen.getByTestId("stats-band");
    expect(band).toHaveAttribute("data-inview", "true");
    // One CountUp per stat now drives the displayed numbers.
    expect(screen.getAllByTestId("countup")).toHaveLength(STATS.length);
    expect(band).toHaveTextContent("99.99%");
    expect(band).toHaveTextContent("0developers required");
  });
});
