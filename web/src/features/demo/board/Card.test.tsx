import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { Card } from "./Card.tsx";
import type { Issue, User } from "../data/types.ts";

const dawn: User = {
  id: "dawn",
  name: "Dawn Prompter",
  initials: "DP",
  avatarColor: "#0052CC",
};
const rovo: User = {
  id: "rovo",
  name: "Rovo Ultra",
  initials: "RU",
  avatarColor: "#6554C0",
  isAgent: true,
};

// A complete issue with every optional field present; tests override fields to
// exercise the absent branches.
function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    key: "SLOP-101",
    type: "story",
    summary: "Generate infinite AI slop with one click",
    description: "desc",
    status: "todo",
    priority: "highest",
    storyPoints: 8,
    assignee: dawn,
    reporter: dawn,
    labels: ["flagship", "slop-core"],
    epic: { name: "Slop Engine", color: "#6554C0" },
    comments: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

// Cards call useDraggable, which requires a DndContext ancestor.
function renderCard(ui: ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe("Card meta", () => {
  it("renders the full Story meta: epic, summary, labels, key, type, priority, points, assignee", () => {
    renderCard(<Card issue={makeIssue()} />);
    expect(screen.getByText("Slop Engine")).toBeInTheDocument();
    expect(
      screen.getByText("Generate infinite AI slop with one click"),
    ).toBeInTheDocument();
    expect(screen.getByText("flagship")).toBeInTheDocument();
    expect(screen.getByText("slop-core")).toBeInTheDocument();
    expect(screen.getByText("SLOP-101")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Story" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Highest priority" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("8 story points")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Assignee: Dawn Prompter"),
    ).toBeInTheDocument();
  });

  it("omits the epic lozenge when the issue has no epic", () => {
    renderCard(<Card issue={makeIssue({ epic: undefined })} />);
    expect(screen.queryByTestId("epic-lozenge")).not.toBeInTheDocument();
  });

  it("omits the label row when there are no labels", () => {
    renderCard(<Card issue={makeIssue({ labels: [] })} />);
    expect(screen.queryByTestId("label-lozenge")).not.toBeInTheDocument();
  });

  it("omits the points badge when storyPoints is null", () => {
    renderCard(<Card issue={makeIssue({ storyPoints: null })} />);
    expect(screen.queryByTestId("story-points")).not.toBeInTheDocument();
  });

  it("renders the unassigned placeholder when assignee is null", () => {
    renderCard(<Card issue={makeIssue({ assignee: null })} />);
    expect(screen.getByLabelText("Unassigned")).toBeInTheDocument();
  });

  it("shows the agent-handled marker only when handledByAgent is true", () => {
    const { rerender } = renderCard(<Card issue={makeIssue()} />);
    expect(screen.queryByTestId("agent-handled")).not.toBeInTheDocument();

    rerender(
      <DndContext>
        <Card issue={makeIssue({ handledByAgent: true, assignee: rovo })} />
      </DndContext>,
    );
    expect(screen.getByTestId("agent-handled")).toBeInTheDocument();
  });

  it.each(["task", "bug", "epic", "subtask"] as const)(
    "renders the %s issue-type icon",
    (type) => {
      renderCard(<Card issue={makeIssue({ type })} />);
      expect(screen.getByTestId("board-card")).toBeInTheDocument();
    },
  );
});

describe("Card interactivity", () => {
  it("calls onOpen on click when interactive", () => {
    const onOpen = vi.fn();
    renderCard(<Card issue={makeIssue()} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId("board-card"));
    expect(onOpen).toHaveBeenCalledWith("SLOP-101");
  });

  it("focuses the card when opened (so the dialog can restore focus to it)", () => {
    // A mouse click on the role=button div does not focus it natively, so the
    // handler focuses the card explicitly — making it the anchor the modal
    // returns focus to on close.
    const onOpen = vi.fn();
    renderCard(<Card issue={makeIssue()} onOpen={onOpen} />);
    const card = screen.getByTestId("board-card");
    expect(card).not.toHaveFocus();
    fireEvent.click(card);
    expect(card).toHaveFocus();
  });

  it("calls onOpen on Enter when interactive", () => {
    const onOpen = vi.fn();
    renderCard(<Card issue={makeIssue()} onOpen={onOpen} />);
    fireEvent.keyDown(screen.getByTestId("board-card"), { key: "Enter" });
    expect(onOpen).toHaveBeenCalledWith("SLOP-101");
  });

  it("ignores other keys (Space is reserved for keyboard drag)", () => {
    const onOpen = vi.fn();
    renderCard(<Card issue={makeIssue()} onOpen={onOpen} />);
    fireEvent.keyDown(screen.getByTestId("board-card"), { key: " " });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not attach click/key handlers when no onOpen is given", () => {
    // No onOpen → not interactive; clicking must not throw and the card is not
    // marked as a clickable cursor.
    renderCard(<Card issue={makeIssue()} />);
    const card = screen.getByTestId("board-card");
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: "Enter" });
    expect(card).not.toHaveClass("cursor-pointer");
  });
});

describe("Card AI slot", () => {
  it("renders the AI slot when provided", () => {
    renderCard(
      <Card issue={makeIssue()} aiSlot={<button>Implement with AI</button>} />,
    );
    expect(screen.getByTestId("card-ai-slot")).toBeInTheDocument();
    expect(screen.getByText("Implement with AI")).toBeInTheDocument();
  });

  it("hides the AI slot by default and reveals it on the card's hover/focus-within", () => {
    // The slot must use `invisible` (visibility: hidden) — which removes its
    // focusable children from the tab order while hidden — NOT opacity-0, which
    // would leave a hidden-but-tabbable control once 0007 puts a button here.
    // jsdom can't resolve the group-hover/group-focus-within pseudo-states from
    // the parent, so assert the wiring via the classes that drive the reveal.
    renderCard(
      <Card issue={makeIssue()} aiSlot={<button>Implement with AI</button>} />,
    );
    const slot = screen.getByTestId("card-ai-slot");
    // Hidden (and untabbable) by default.
    expect(slot).toHaveClass("invisible");
    // Not revealed via opacity (the a11y trap we are avoiding).
    expect(slot).not.toHaveClass("opacity-0");
    // Revealed only on hover or when something inside the card is focused.
    expect(slot).toHaveClass("group-hover:visible");
    expect(slot).toHaveClass("group-focus-within:visible");
  });

  it("omits the AI slot container when not provided", () => {
    renderCard(<Card issue={makeIssue()} />);
    expect(screen.queryByTestId("card-ai-slot")).not.toBeInTheDocument();
  });
});
