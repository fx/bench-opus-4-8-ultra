import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// While a dragged card hovers a column, @dnd-kit's useDroppable returns
// `isOver: true`, which the Column uses to highlight its dropzone. jsdom can't
// produce a real drag-over, so this file mocks the hook to that state (in
// isolation) to cover the highlight branch.
vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    useDroppable: () => ({ setNodeRef: () => {}, isOver: true }),
  };
});

import { DndContext } from "@dnd-kit/core";
import { Column } from "./Column.tsx";

describe("Column while a card is over it", () => {
  it("highlights the dropzone (data-over + ring)", () => {
    render(
      <DndContext>
        <Column status="todo" issues={[]} />
      </DndContext>,
    );
    const dropzone = screen.getByTestId("column-dropzone-todo");
    expect(dropzone).toHaveAttribute("data-over", "true");
    expect(dropzone).toHaveClass("bg-accent");
  });
});
