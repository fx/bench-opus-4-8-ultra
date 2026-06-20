import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { Board } from "./Board.tsx";
import { resolveDropStatus } from "./board-dnd.ts";
import {
  selectIssueByKey,
  selectIssuesByStatus,
  selectStatusCounts,
  useDemoStore,
} from "../store/store.ts";

// Capture the onDragEnd handler the Board hands to @dnd-kit's DndContext so we
// can invoke the real drop logic with synthetic events — testing the handler
// directly, without simulating pointer drags (per change 0005's testing note).
// The sensor hooks are stubbed to no-ops since we never mount a real sensor.
let capturedOnDragEnd: ((event: DragEndEvent) => void) | undefined;

vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    DndContext: (props: {
      children: React.ReactNode;
      onDragEnd?: (event: DragEndEvent) => void;
    }) => {
      capturedOnDragEnd = props.onDragEnd;
      return <div data-testid="dnd-context">{props.children}</div>;
    },
    useSensor: () => undefined,
    useSensors: () => [],
  };
});

beforeEach(() => {
  useDemoStore.getState().reset();
  capturedOnDragEnd = undefined;
});

describe("resolveDropStatus", () => {
  it("returns the Status when the drop id is a known column", () => {
    expect(resolveDropStatus("todo")).toBe("todo");
    expect(resolveDropStatus("in_progress")).toBe("in_progress");
    expect(resolveDropStatus("in_review")).toBe("in_review");
    expect(resolveDropStatus("done")).toBe("done");
  });

  it("returns null for a missing drop target (released outside a column)", () => {
    expect(resolveDropStatus(null)).toBeNull();
    expect(resolveDropStatus(undefined)).toBeNull();
  });

  it("returns null for an unrecognised drop id", () => {
    expect(resolveDropStatus("not-a-column")).toBeNull();
    expect(resolveDropStatus(123)).toBeNull();
  });
});

describe("Board rendering", () => {
  it("renders the four ordered columns with seed counts", () => {
    render(<Board />);
    expect(
      screen.getByRole("region", { name: "Kanban board" }),
    ).toBeInTheDocument();

    const state = useDemoStore.getState();
    const counts = selectStatusCounts(state);
    const labelByStatus = {
      todo: "To Do",
      in_progress: "In Progress",
      in_review: "In Review",
      done: "Done",
    } as const;
    for (const [status, label] of Object.entries(labelByStatus)) {
      const column = screen.getByRole("region", { name: label });
      const count = column.querySelector('[data-testid="column-count"]');
      expect(count).toHaveTextContent(
        String(counts[status as keyof typeof counts]),
      );
    }
  });
});

describe("Board drag-end handler", () => {
  it("maps a drop onto a column to moveIssue and updates both counts live", () => {
    render(<Board />);
    expect(capturedOnDragEnd).toBeTypeOf("function");

    const before = selectStatusCounts(useDemoStore.getState());
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];

    act(() => {
      capturedOnDragEnd!({
        active: { id: todo.key },
        over: { id: "in_progress" },
      } as DragEndEvent);
    });

    const after = selectStatusCounts(useDemoStore.getState());
    expect(selectIssueByKey(useDemoStore.getState(), todo.key)?.status).toBe(
      "in_progress",
    );
    expect(after.todo).toBe(before.todo - 1);
    expect(after.in_progress).toBe(before.in_progress + 1);
  });

  it("does nothing when the card is released outside any column (no over)", () => {
    render(<Board />);
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];
    const issuesBefore = useDemoStore.getState().issues;

    capturedOnDragEnd!({
      active: { id: todo.key },
      over: null,
    } as DragEndEvent);

    // resolveDropStatus → null short-circuits: store untouched.
    expect(useDemoStore.getState().issues).toBe(issuesBefore);
    expect(selectIssueByKey(useDemoStore.getState(), todo.key)?.status).toBe(
      "todo",
    );
  });

  it("does nothing when dropped onto an unrecognised target", () => {
    render(<Board />);
    const todo = selectIssuesByStatus(useDemoStore.getState(), "todo")[0];
    const issuesBefore = useDemoStore.getState().issues;

    capturedOnDragEnd!({
      active: { id: todo.key },
      over: { id: "trash-can" },
    } as DragEndEvent);

    expect(useDemoStore.getState().issues).toBe(issuesBefore);
  });
});
