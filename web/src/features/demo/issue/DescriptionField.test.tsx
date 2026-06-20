import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DescriptionField } from "./DescriptionField.tsx";

describe("DescriptionField", () => {
  it("renders the description as read-only text until clicked", () => {
    render(<DescriptionField description="A slop feature" onSave={() => {}} />);
    expect(screen.getByTestId("description-display")).toHaveTextContent(
      "A slop feature",
    );
    expect(
      screen.queryByTestId("description-textarea"),
    ).not.toBeInTheDocument();
  });

  it("shows a placeholder when the description is empty", () => {
    render(<DescriptionField description="   " onSave={() => {}} />);
    expect(screen.getByTestId("description-display")).toHaveTextContent(
      "Add a description…",
    );
  });

  it("enters edit mode on click, seeded with the current text and focused", async () => {
    const user = userEvent.setup();
    render(<DescriptionField description="Original" onSave={() => {}} />);

    await user.click(screen.getByTestId("description-display"));
    const textarea = screen.getByTestId("description-textarea");
    expect(textarea).toHaveValue("Original");
    expect(textarea).toHaveFocus();
  });

  it("saves the edited text via onSave and returns to read mode", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DescriptionField description="Original" onSave={onSave} />);

    await user.click(screen.getByTestId("description-display"));
    const textarea = screen.getByTestId("description-textarea");
    await user.clear(textarea);
    await user.type(textarea, "Rewritten");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("Rewritten");
    expect(
      screen.queryByTestId("description-textarea"),
    ).not.toBeInTheDocument();
  });

  it("cancels without saving, discarding the draft", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DescriptionField description="Original" onSave={onSave} />);

    await user.click(screen.getByTestId("description-display"));
    await user.clear(screen.getByTestId("description-textarea"));
    await user.type(screen.getByTestId("description-textarea"), "junk");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onSave).not.toHaveBeenCalled();
    // Re-opening shows the original, not the discarded draft.
    await user.click(screen.getByTestId("description-display"));
    expect(screen.getByTestId("description-textarea")).toHaveValue("Original");
  });

  it("saves with Cmd/Ctrl+Enter", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DescriptionField description="Original" onSave={onSave} />);

    await user.click(screen.getByTestId("description-display"));
    const textarea = screen.getByTestId("description-textarea");
    await user.clear(textarea);
    await user.type(textarea, "Saved by keyboard");
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(onSave).toHaveBeenCalledWith("Saved by keyboard");
  });

  it("cancels with Escape", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DescriptionField description="Original" onSave={onSave} />);

    await user.click(screen.getByTestId("description-display"));
    await user.type(screen.getByTestId("description-textarea"), "x");
    await user.keyboard("{Escape}");

    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("description-textarea"),
    ).not.toBeInTheDocument();
  });

  it("ignores a bare Enter (newline) without metaKey/ctrlKey", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<DescriptionField description="Original" onSave={onSave} />);

    await user.click(screen.getByTestId("description-display"));
    await user.type(screen.getByTestId("description-textarea"), "line1{Enter}");

    // A plain Enter inserts a newline; it must NOT save or exit edit mode.
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByTestId("description-textarea")).toBeInTheDocument();
  });

  it("renders the aiSlot beside the heading in read mode", () => {
    render(
      <DescriptionField
        description="x"
        onSave={() => {}}
        aiSlot={<button>AI</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "AI" })).toBeInTheDocument();
  });

  it("hides the aiSlot while the inline editor is open (no stale-draft clobber)", async () => {
    const user = userEvent.setup();
    render(
      <DescriptionField
        description="x"
        onSave={() => {}}
        aiSlot={<button>AI</button>}
      />,
    );
    // Enter edit mode → the AI-generate action is removed so generating can't be
    // clobbered by the textarea's stale draft on Save.
    await user.click(screen.getByTestId("description-display"));
    expect(
      screen.queryByRole("button", { name: "AI" }),
    ).not.toBeInTheDocument();
    // Leaving edit mode restores it.
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "AI" })).toBeInTheDocument();
  });

  it("notifies onEditingChange when entering and leaving edit mode", async () => {
    const user = userEvent.setup();
    const onEditingChange = vi.fn();
    render(
      <DescriptionField
        description="Original"
        onSave={() => {}}
        onEditingChange={onEditingChange}
      />,
    );

    // Initial mount publishes the read-mode (false) state.
    expect(onEditingChange).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByTestId("description-display"));
    expect(onEditingChange).toHaveBeenLastCalledWith(true);

    await user.keyboard("{Escape}");
    expect(onEditingChange).toHaveBeenLastCalledWith(false);
  });
});
