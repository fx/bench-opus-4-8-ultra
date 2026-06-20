import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// During an active drag, @dnd-kit's useDraggable returns a non-null `transform`
// and `isDragging: true`. jsdom can't produce a real pointer drag, so this file
// mocks the hook to that active state (in isolation, via a top-level vi.mock) to
// cover the Card's drag transform + dragging-style branch. DndContext is kept
// real so the Card still mounts inside a provider.
vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      isDragging: true,
    }),
  };
});

import { DndContext } from "@dnd-kit/core";
import { Card } from "./Card.tsx";
import type { Issue } from "../data/types.ts";

const issue: Issue = {
  key: "SLOP-101",
  type: "story",
  summary: "Generate infinite AI slop with one click",
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

describe("Card during an active drag", () => {
  it("applies the dragging translate transform and drag styling", () => {
    render(
      <DndContext>
        <Card issue={issue} />
      </DndContext>,
    );
    const card = screen.getByTestId("board-card");
    expect(card).toHaveAttribute("data-dragging", "true");
    expect(card).toHaveStyle({ transform: "translate3d(10px, 20px, 0)" });
    expect(card).toHaveClass("opacity-60");
  });
});
