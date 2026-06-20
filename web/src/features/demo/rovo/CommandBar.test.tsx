import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { CommandBar } from "./CommandBar.tsx";
import { useDemoStore } from "../store/store.ts";

beforeEach(() => {
  useDemoStore.getState().reset();
});

describe("CommandBar", () => {
  it("opens the dialog and returns a scripted, citation-laden answer", () => {
    render(<CommandBar />);
    fireEvent.click(screen.getByRole("button", { name: "Ask Rovo" }));

    const dialog = screen.getByTestId("ask-rovo");
    const input = within(dialog).getByTestId("ask-rovo-input");
    fireEvent.change(input, { target: { value: "should we ship it?" } });
    fireEvent.click(within(dialog).getByTestId("ask-rovo-submit"));

    const answer = screen.getByTestId("ask-rovo-answer");
    expect(answer).toBeInTheDocument();
    // Over-confident + cites (fabricated) sources.
    expect(within(answer).getByText(/Confidence:/)).toBeInTheDocument();
    expect(
      within(answer).getAllByTestId("ask-rovo-citation").length,
    ).toBeGreaterThan(0);
    expect(useDemoStore.getState().rovoAnswer).not.toBeNull();
  });

  it("answers even a blank query (Rovo never has nothing)", () => {
    render(<CommandBar />);
    fireEvent.click(screen.getByRole("button", { name: "Ask Rovo" }));
    const dialog = screen.getByTestId("ask-rovo");
    fireEvent.click(within(dialog).getByTestId("ask-rovo-submit"));
    expect(screen.getByTestId("ask-rovo-answer")).toBeInTheDocument();
  });

  it("clears the answer and input when the dialog closes", () => {
    render(<CommandBar />);
    fireEvent.click(screen.getByRole("button", { name: "Ask Rovo" }));
    const dialog = screen.getByTestId("ask-rovo");
    const input = within(dialog).getByTestId("ask-rovo-input");
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.click(within(dialog).getByTestId("ask-rovo-submit"));
    expect(useDemoStore.getState().rovoAnswer).not.toBeNull();

    // Close via Escape → onOpenChange(false) clears the answer.
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(useDemoStore.getState().rovoAnswer).toBeNull();
  });
});
