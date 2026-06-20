import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const reducedRef = { value: false };
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return { ...actual, useReducedMotionSafe: () => reducedRef.value };
});

import { Pricing } from "./Pricing.tsx";

function renderPricing() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Pricing />} />
        <Route path="/demo" element={<h1>Demo Destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Pricing", () => {
  beforeEach(() => {
    reducedRef.value = false;
  });

  it("renders three tiers with the middle one marked Most popular", () => {
    renderPricing();
    expect(screen.getByText("Hobby Slop")).toBeInTheDocument();
    expect(screen.getByText("Pro Agentic")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Singularity")).toBeInTheDocument();
    expect(screen.getByText("Most popular")).toBeInTheDocument();
  });

  it("shows monthly prices by default and switches to annual math on toggle", async () => {
    const user = userEvent.setup();
    renderPricing();
    // Monthly default: Pro shows $99/mo, no annual note.
    expect(screen.getByText("$99")).toBeInTheDocument();
    expect(
      screen.queryByText("billed $990/yr · 2 months free"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("switch", { name: "Toggle annual billing" }),
    );

    // Annual: effective monthly $83 with the savings note.
    expect(screen.getByText("$83")).toBeInTheDocument();
    expect(
      screen.getByText("billed $990/yr · 2 months free"),
    ).toBeInTheDocument();
    // Free and custom-label tiers are unaffected by the toggle.
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getAllByText("Talk to an agent").length).toBeGreaterThan(0);

    // Toggling back returns to monthly pricing (exercises the off branch).
    await user.click(
      screen.getByRole("switch", { name: "Toggle annual billing" }),
    );
    expect(screen.getByText("$99")).toBeInTheDocument();
    expect(
      screen.queryByText("billed $990/yr · 2 months free"),
    ).not.toBeInTheDocument();
  });

  it("routes a tier CTA to /demo client-side", async () => {
    const user = userEvent.setup();
    renderPricing();
    await user.click(screen.getByRole("link", { name: "Deploy the swarm" }));
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });

  it("still renders prices with animations disabled under reduced motion", () => {
    reducedRef.value = true;
    renderPricing();
    // The reduced branch (motion initial={false}) renders the same amounts.
    expect(screen.getByText("$99")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("elevates the popular tier card", () => {
    renderPricing();
    // The popular card carries the elevation class and contains both the
    // "Most popular" badge and the Pro Agentic heading.
    const card = screen
      .getByRole("heading", { name: "Pro Agentic" })
      .closest(".border-primary\\/60");
    expect(card).not.toBeNull();
    expect(
      within(card as HTMLElement).getByText("Most popular"),
    ).toBeInTheDocument();
  });
});
