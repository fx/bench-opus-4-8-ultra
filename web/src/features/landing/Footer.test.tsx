import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Footer } from "./Footer.tsx";
import {
  FOOTER_COLUMNS,
  FOOTER_FINE_PRINT,
  FOOTER_SOCIALS,
  FOOTER_STATUS,
} from "./content.ts";

function renderFooter() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Footer />} />
        <Route path="/demo" element={<h1>Demo Destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Footer", () => {
  it("renders all link columns and their links", () => {
    renderFooter();
    for (const column of FOOTER_COLUMNS) {
      expect(
        screen.getByRole("heading", { name: column.heading }),
      ).toBeInTheDocument();
      for (const link of column.links) {
        expect(screen.getByText(link)).toBeInTheDocument();
      }
    }
  });

  it("renders the status pill, socials, and fine print", () => {
    renderFooter();
    expect(screen.getByText(FOOTER_STATUS)).toBeInTheDocument();
    expect(screen.getByText(FOOTER_FINE_PRINT)).toBeInTheDocument();
    for (const social of FOOTER_SOCIALS) {
      expect(screen.getByText(social)).toBeInTheDocument();
    }
  });

  it("renders the giant ghosted SLOP wordmark as decorative", () => {
    const { container } = renderFooter();
    const ghost = container.querySelector('[aria-hidden="true"]');
    expect(ghost).not.toBeNull();
    expect(screen.getByText("SLOP")).toBeInTheDocument();
  });

  it("renders internal /demo navigations as client-side router links", () => {
    renderFooter();
    // Socials and footer column links all point at the in-app /demo route, so
    // they must be React Router <Link>s (rendered as <a href="/demo"> the router
    // intercepts) — not raw anchors that trigger a full page reload.
    const demoLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/demo");
    const expectedDemoLinks =
      FOOTER_SOCIALS.length +
      FOOTER_COLUMNS.reduce((sum, c) => sum + c.links.length, 0);
    expect(demoLinks).toHaveLength(expectedDemoLinks);
  });

  it("navigates to /demo client-side when a footer column link is clicked", async () => {
    const user = userEvent.setup();
    renderFooter();
    // Clicking routes within the SPA (the destination renders without a reload).
    await user.click(screen.getByText(FOOTER_COLUMNS[0].links[0]));
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });

  it("navigates to /demo client-side when a social link is clicked", async () => {
    const user = userEvent.setup();
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    await user.click(within(footer).getByText(FOOTER_SOCIALS[0]));
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });

  it("gives social links a ≥44×44 square tap target", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    // Short labels like "X" need a min width as well as height, so socials
    // carry both min-h-11 and min-w-11 (44px) and center their content.
    for (const social of FOOTER_SOCIALS) {
      expect(within(footer).getByText(social)).toHaveClass(
        "min-h-11",
        "min-w-11",
      );
    }
  });
});
