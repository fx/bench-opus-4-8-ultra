import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentComposer } from "./CommentComposer.tsx";

describe("CommentComposer", () => {
  it("disables Save until there is non-whitespace input", async () => {
    const user = userEvent.setup();
    render(<CommentComposer onSubmit={() => {}} />);

    const save = screen.getByTestId("comment-submit");
    expect(save).toBeDisabled();

    await user.type(screen.getByTestId("comment-input"), "   ");
    expect(save).toBeDisabled();

    await user.type(screen.getByTestId("comment-input"), "real");
    expect(save).toBeEnabled();
  });

  it("submits the comment and clears the input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CommentComposer onSubmit={onSubmit} />);

    const input = screen.getByTestId("comment-input");
    await user.type(input, "Nice work");
    await user.click(screen.getByTestId("comment-submit"));

    expect(onSubmit).toHaveBeenCalledWith("Nice work");
    expect(input).toHaveValue("");
  });

  it("submits with Cmd/Ctrl+Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CommentComposer onSubmit={onSubmit} />);

    await user.type(screen.getByTestId("comment-input"), "Via keyboard");
    await user.keyboard("{Meta>}{Enter}{/Meta}");

    expect(onSubmit).toHaveBeenCalledWith("Via keyboard");
  });

  it("does not submit a whitespace-only body via keyboard shortcut", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CommentComposer onSubmit={onSubmit} />);

    await user.type(screen.getByTestId("comment-input"), "   ");
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ignores a bare Enter (newline) without a modifier", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CommentComposer onSubmit={onSubmit} />);

    await user.type(screen.getByTestId("comment-input"), "line{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders the aiSlot in the action row", () => {
    render(
      <CommentComposer
        onSubmit={() => {}}
        aiSlot={<button>Reply with AI</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Reply with AI" }),
    ).toBeInTheDocument();
  });
});
