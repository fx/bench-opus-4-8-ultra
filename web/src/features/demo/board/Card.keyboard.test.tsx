import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// @dnd-kit's keyboard drag sensor wires its handling through
// listeners.onKeyDown. The Card MUST forward keydown events to that handler
// (not replace it) or keyboard dragging breaks. This file mocks useDraggable to
// inject a spy onKeyDown so we can assert the Card calls it — both for the
// interactive (onOpen) path and the non-interactive path — and that Enter still
// opens detail without swallowing the drag handler.
const dndKeyDown = vi.fn();

vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    useDraggable: () => ({
      attributes: { role: "button", tabIndex: 0 },
      listeners: { onKeyDown: dndKeyDown },
      setNodeRef: () => {},
      transform: null,
      isDragging: false,
    }),
  };
});

import { DndContext } from "@dnd-kit/core";
import { Card } from "./Card.tsx";
import type { Issue } from "../data/types.ts";

const issue: Issue = {
  key: "SLOP-101",
  type: "story",
  summary: "Generate infinite AI slop",
  description: "d",
  status: "todo",
  priority: "high",
  storyPoints: 5,
  assignee: null,
  reporter: { id: "r", name: "R", initials: "RR", avatarColor: "#000" },
  labels: [],
  comments: [],
  createdAt: 0,
  updatedAt: 0,
};

function renderCard(ui: ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe("Card keyboard drag forwarding", () => {
  it("forwards the dnd keyboard handler AND opens on Enter when interactive", () => {
    const onOpen = vi.fn();
    dndKeyDown.mockClear();
    renderCard(<Card issue={issue} onOpen={onOpen} />);
    const card = screen.getByTestId("board-card");

    // Space (the dnd pick-up key) is forwarded to @dnd-kit, not swallowed.
    fireEvent.keyDown(card, { key: " " });
    expect(dndKeyDown).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();

    // Enter opens detail AND still forwards to @dnd-kit's handler.
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onOpen).toHaveBeenCalledWith("SLOP-101");
    expect(dndKeyDown).toHaveBeenCalledTimes(2);
  });

  it("uses the dnd keyboard handler directly when not interactive", () => {
    dndKeyDown.mockClear();
    renderCard(<Card issue={issue} />);
    fireEvent.keyDown(screen.getByTestId("board-card"), { key: " " });
    expect(dndKeyDown).toHaveBeenCalledTimes(1);
  });
});
