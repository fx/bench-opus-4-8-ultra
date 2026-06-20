import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TopNav } from "./TopNav.tsx";

// TopNav's wordmark is a React Router <Link>, so renders need a Router context.
function renderNav(props?: { className?: string }) {
  return render(
    <MemoryRouter>
      <TopNav {...props} />
    </MemoryRouter>,
  );
}

describe("TopNav", () => {
  it("renders the app switcher, wordmark, Create button, and search", () => {
    renderNav();
    expect(
      screen.getByRole("button", { name: "App switcher" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Slop Jira")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search" }),
    ).toBeInTheDocument();
  });

  it("renders the primary nav items with Projects active", () => {
    renderNav();
    for (const label of ["Your work", "Projects", "Filters", "Dashboards"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Non-active items must not claim the current-page state.
    expect(
      screen.getByRole("button", { name: "Your work" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("renders the right cluster including the Ask Rovo AI entry point", () => {
    renderNav();
    expect(
      screen.getByRole("button", { name: "Ask Rovo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
    // Profile avatar fallback.
    expect(screen.getByText("DP")).toBeInTheDocument();
  });

  it("forwards a className to the header element", () => {
    renderNav({ className: "custom-nav" });
    expect(screen.getByRole("banner")).toHaveClass("custom-nav");
  });

  // Responsive degradation so the bar never forces horizontal overflow < lg.
  it("clips overflow on the header so it never produces document scroll", () => {
    renderNav();
    expect(screen.getByRole("banner")).toHaveClass("overflow-hidden");
  });

  it("hides the wordmark caption below lg while keeping the mark", () => {
    renderNav();
    const caption = screen.getByText("Slop Jira");
    expect(caption).toHaveClass("hidden");
    expect(caption).toHaveClass("lg:inline");
  });

  it("drops the secondary Help and Settings icons below lg", () => {
    renderNav();
    expect(screen.getByRole("button", { name: "Help" })).toHaveClass("hidden");
    expect(screen.getByRole("button", { name: "Help" })).toHaveClass(
      "lg:inline-flex",
    );
    expect(screen.getByRole("button", { name: "Settings" })).toHaveClass(
      "hidden",
    );
    expect(screen.getByRole("button", { name: "Settings" })).toHaveClass(
      "lg:inline-flex",
    );
  });

  it("keeps the primary affordances reachable at every breakpoint", () => {
    renderNav();
    // These must NOT carry a `hidden` class — always visible.
    for (const name of [
      "App switcher",
      "Create",
      "Ask Rovo",
      "Notifications",
    ]) {
      expect(screen.getByRole("button", { name })).not.toHaveClass("hidden");
    }
  });
});
