import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar.tsx";
import { useDemoStore } from "../store/store.ts";

beforeEach(() => {
  useDemoStore.getState().reset();
});

describe("Sidebar", () => {
  it("shows the SLOP project context when expanded", () => {
    render(<Sidebar />);
    expect(screen.getByText("Slop Simulator")).toBeInTheDocument();
    expect(screen.getByText("SLOP project")).toBeInTheDocument();
  });

  it("renders the full view list with Board active and Rovo Agents present", () => {
    render(<Sidebar />);
    for (const label of [
      "Summary",
      "Timeline",
      "Backlog",
      "Board",
      "Calendar",
      "Reports",
      "Issues",
      "Rovo Agents",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    // Board carries the active/current-page marker on its interactive element.
    expect(screen.getByRole("button", { name: "Board" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // A non-active item must not claim the current-page state.
    expect(screen.getByRole("button", { name: "Summary" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("collapses to an icon rail, hiding labels and project name", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: "Project" });
    expect(nav).toHaveAttribute("data-collapsed", "false");

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(nav).toHaveAttribute("data-collapsed", "true");
    // Project name text is dropped from the rail.
    expect(screen.queryByText("Slop Simulator")).not.toBeInTheDocument();
    // Items remain reachable by their accessible name (label text is hidden).
    expect(screen.getByRole("button", { name: "Board" })).toBeInTheDocument();
  });

  it("expands again when toggled from the collapsed state", async () => {
    const user = userEvent.setup();
    useDemoStore.getState().setSidebarCollapsed(true);
    render(<Sidebar />);

    const nav = screen.getByRole("navigation", { name: "Project" });
    expect(nav).toHaveAttribute("data-collapsed", "true");

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));

    expect(nav).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByText("Slop Simulator")).toBeInTheDocument();
  });

  it("reflects the toggle button's aria-expanded state", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("forwards a className to the nav element", () => {
    render(<Sidebar className="custom-rail" />);
    expect(screen.getByRole("navigation", { name: "Project" })).toHaveClass(
      "custom-rail",
    );
  });
});
