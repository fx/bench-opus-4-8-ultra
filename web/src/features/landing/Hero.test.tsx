import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Reduced motion keeps the terminal static (no scheduled timers) so the Hero
// renders deterministically without a fake clock here.
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return { ...actual, useReducedMotionSafe: () => true };
});

import { Hero } from "./Hero.tsx";
import { HERO } from "./content.ts";

function renderHero() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/demo" element={<h1>Demo Destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Hero", () => {
  it("renders the eyebrow, tagline, subhead, dual CTA, and terminal mock", () => {
    renderHero();
    expect(screen.getByText(HERO.eyebrow)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: HERO.tagline }),
    ).toBeInTheDocument();
    expect(screen.getByText(HERO.subhead)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: HERO.primaryCta })).toHaveAttribute(
      "href",
      "/demo",
    );
    expect(
      screen.getByRole("link", { name: HERO.secondaryCta }),
    ).toHaveAttribute("href", "/demo");
    expect(screen.getByTestId("hero-terminal")).toBeInTheDocument();
  });

  it("routes both CTAs to /demo client-side", async () => {
    const user = userEvent.setup();
    renderHero();
    await user.click(screen.getByRole("link", { name: HERO.secondaryCta }));
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });
});
