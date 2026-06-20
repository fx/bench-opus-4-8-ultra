import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./AppShell.tsx";
import { useDemoStore } from "../store/store.ts";

beforeEach(() => {
  useDemoStore.getState().reset();
});

// AppShell mounts TopNav's <Link>, so it needs a Router context.
function renderShell() {
  return render(
    <MemoryRouter>
      <AppShell />
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("applies the jira theme scope", () => {
    const { container } = renderShell();
    expect(container.querySelector('[data-theme="jira"]')).not.toBeNull();
  });

  it("renders the three chrome zones: top nav, sidebar, and main board", () => {
    renderShell();
    // Top nav (banner landmark) with the wordmark.
    expect(screen.getByText("Slop Jira")).toBeInTheDocument();
    // Sidebar (Project navigation landmark).
    expect(
      screen.getByRole("navigation", { name: "Project" }),
    ).toBeInTheDocument();
    // Main board zone with its heading.
    expect(screen.getByRole("main", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Board" })).toBeInTheDocument();
  });

  it("shows the SLOP project context in the board breadcrumb", () => {
    renderShell();
    expect(screen.getByText("Projects / Slop Simulator")).toBeInTheDocument();
  });

  it("renders the placeholder board container", () => {
    renderShell();
    expect(screen.getByTestId("board-placeholder")).toBeInTheDocument();
    expect(screen.getByText("The board lands here.")).toBeInTheDocument();
  });

  it("clips horizontal overflow at the shell root so the document never scrolls sideways", () => {
    const { container } = renderShell();
    const root = container.querySelector('[data-theme="jira"]');
    expect(root).toHaveClass("overflow-x-hidden");
    expect(root).toHaveClass("w-full");
  });
});
