import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { Column } from "./Column.tsx";
import type { Issue } from "../data/types.ts";

function makeIssue(key: string, overrides: Partial<Issue> = {}): Issue {
  return {
    key,
    type: "task",
    summary: `Summary ${key}`,
    description: "d",
    status: "todo",
    priority: "medium",
    storyPoints: 3,
    assignee: null,
    reporter: {
      id: "r",
      name: "Reporter",
      initials: "RR",
      avatarColor: "#000",
    },
    labels: [],
    comments: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function renderColumn(ui: ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe("Column", () => {
  it("renders the column name and a live count of its issues", () => {
    renderColumn(
      <Column
        status="todo"
        issues={[makeIssue("SLOP-1"), makeIssue("SLOP-2")]}
      />,
    );
    expect(screen.getByRole("region", { name: "To Do" })).toBeInTheDocument();
    expect(screen.getByTestId("column-count")).toHaveTextContent("2");
    expect(screen.getByLabelText("2 issues")).toBeInTheDocument();
  });

  it("renders a card per issue", () => {
    renderColumn(
      <Column
        status="in_progress"
        issues={[makeIssue("SLOP-1"), makeIssue("SLOP-2")]}
      />,
    );
    expect(screen.getAllByTestId("board-card")).toHaveLength(2);
  });

  it("shows the empty-state hint and a zero count when there are no issues", () => {
    renderColumn(<Column status="done" issues={[]} />);
    expect(screen.getByTestId("column-count")).toHaveTextContent("0");
    expect(screen.getByText("No issues")).toBeInTheDocument();
    expect(screen.queryByTestId("board-card")).not.toBeInTheDocument();
  });

  it("threads onOpenIssue down to its cards", () => {
    const onOpenIssue = vi.fn();
    renderColumn(
      <Column
        status="todo"
        issues={[makeIssue("SLOP-1")]}
        onOpenIssue={onOpenIssue}
      />,
    );
    fireEvent.click(screen.getByTestId("board-card"));
    expect(onOpenIssue).toHaveBeenCalledWith("SLOP-1");
  });

  it("threads renderAiSlot down to its cards", () => {
    renderColumn(
      <Column
        status="todo"
        issues={[makeIssue("SLOP-1")]}
        renderAiSlot={(issue) => <span>AI:{issue.key}</span>}
      />,
    );
    expect(screen.getByText("AI:SLOP-1")).toBeInTheDocument();
  });

  it("exposes a labelled dropzone for the status", () => {
    renderColumn(<Column status="in_review" issues={[]} />);
    expect(screen.getByTestId("column-dropzone-in_review")).toBeInTheDocument();
  });
});
