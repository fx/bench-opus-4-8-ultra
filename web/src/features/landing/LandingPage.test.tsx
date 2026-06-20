import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Reduced motion keeps the whole page static (no terminal timers, no marquee/
// aurora loops) so the integration render is deterministic.
vi.mock("../../components/motion/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../components/motion/index.ts")>();
  return { ...actual, useReducedMotionSafe: () => true };
});

import { LandingPage } from "./LandingPage.tsx";
import { BIG_CTA, HERO, LOGO_CLOUD_HEADING } from "./content.ts";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<h1>Demo Destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  it("applies the marketing theme scope", () => {
    const { container } = renderPage();
    expect(container.querySelector('[data-theme="marketing"]')).not.toBeNull();
  });

  it("renders all eleven sections with real content", () => {
    renderPage();
    // 1. Nav (announcement) + 2. Hero
    expect(screen.getByText(/Series Slop/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: HERO.tagline }),
    ).toBeInTheDocument();
    // 3. Logo cloud
    expect(screen.getByText(LOGO_CLOUD_HEADING)).toBeInTheDocument();
    // 4. Feature bento
    expect(
      screen.getByRole("heading", { name: "Agentic Slopflows" }),
    ).toBeInTheDocument();
    // 5. How it works
    expect(
      screen.getByRole("heading", { name: "Describe a vibe" }),
    ).toBeInTheDocument();
    // 6. Stats
    expect(screen.getByText("developers required")).toBeInTheDocument();
    // 7. Testimonials
    expect(screen.getByText("Brock Tensor")).toBeInTheDocument();
    // 8. Pricing
    expect(screen.getByText("Pro Agentic")).toBeInTheDocument();
    // 9. FAQ
    expect(
      screen.getByRole("button", { name: "Is the slop actually any good?" }),
    ).toBeInTheDocument();
    // 10. Big CTA
    expect(
      screen.getByRole("heading", { name: BIG_CTA.headline }),
    ).toBeInTheDocument();
    // 11. Footer
    expect(screen.getByText("SLOP")).toBeInTheDocument();
  });

  it("exposes a Demo CTA in the sticky nav that routes to /demo", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getAllByRole("link", { name: "Demo" })[0]);
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });
});
