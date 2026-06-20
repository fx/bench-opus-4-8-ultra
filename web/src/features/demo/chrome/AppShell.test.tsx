import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders the Kanban board with its four columns", () => {
    renderShell();
    expect(
      screen.getByRole("region", { name: "Kanban board" }),
    ).toBeInTheDocument();
    // The board's four ordered columns are present.
    for (const name of ["To Do", "In Progress", "In Review", "Done"]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
  });

  it("clips horizontal overflow at the shell root so the document never scrolls sideways", () => {
    const { container } = renderShell();
    const root = container.querySelector('[data-theme="jira"]');
    expect(root).toHaveClass("overflow-x-hidden");
    expect(root).toHaveClass("w-full");
  });

  it("opens the issue detail when a board card is clicked, and closes back to the board", async () => {
    const user = userEvent.setup();
    renderShell();

    // The detail modal is not mounted until a card is clicked.
    expect(screen.queryByTestId("issue-detail")).not.toBeInTheDocument();

    const card = screen.getByText("Generate infinite AI slop with one click");
    await user.click(card);

    // Detail opens for the clicked card and the store records the selection.
    const modal = screen.getByTestId("issue-detail");
    expect(within(modal).getByText("SLOP-101")).toBeInTheDocument();
    expect(useDemoStore.getState().selectedIssueKey).toBe("SLOP-101");

    // Escape returns to the board (selection cleared, modal unmounted).
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("issue-detail")).not.toBeInTheDocument();
    expect(useDemoStore.getState().selectedIssueKey).toBeNull();
  });

  it("restores focus to the originating card after the modal closes", async () => {
    const user = userEvent.setup();
    renderShell();

    // Find the focusable card element (the role=button div, not the inner text).
    const card = screen
      .getByText("Generate infinite AI slop with one click")
      .closest('[data-testid="board-card"]') as HTMLElement;

    await user.click(card);
    expect(screen.getByTestId("issue-detail")).toBeInTheDocument();

    // Close via the built-in dialog close button.
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("issue-detail")).not.toBeInTheDocument();

    // Focus is returned to the card that opened the modal (not <body>), so the
    // keyboard a11y loop is intact.
    expect(document.activeElement).toBe(card);
  });
});
