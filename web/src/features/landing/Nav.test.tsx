import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Nav } from "./Nav.tsx";

// Render the Nav inside a router with a /demo route stub so client-side
// navigation can be asserted by the destination rendering (no full reload).
function renderNav() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Nav />} />
        <Route path="/demo" element={<h1>Demo Destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Nav", () => {
  it("renders the wordmark, announcement, anchors, and a Demo CTA", () => {
    renderNav();
    expect(screen.getByText(/Series Slop/)).toBeInTheDocument();
    // Anchor links present (desktop set + mobile set may both exist in DOM).
    expect(screen.getAllByText("Features").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pricing").length).toBeGreaterThan(0);
    // A Demo link routes to /demo.
    const demo = screen.getAllByRole("link", { name: "Demo" })[0];
    expect(demo).toHaveAttribute("href", "/demo");
  });

  it("navigates to /demo client-side when the nav Demo CTA is clicked", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getAllByRole("link", { name: "Demo" })[0]);
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });

  it("opens and closes the mobile menu", async () => {
    const user = userEvent.setup();
    renderNav();
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("keeps a working Demo CTA in the mobile menu that routes to /demo", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = screen.getByTestId("mobile-menu");
    const demo = within(menu).getByRole("link", { name: "Demo" });
    await user.click(demo);
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });

  it("closes the mobile menu when an anchor link is tapped", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = screen.getByTestId("mobile-menu");
    await user.click(within(menu).getByText("Features"));
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when the Log in link is tapped", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = screen.getByTestId("mobile-menu");
    await user.click(within(menu).getByRole("link", { name: "Log in" }));
    // Routed to /demo (Log in routes to demo per the spec default).
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });
});
