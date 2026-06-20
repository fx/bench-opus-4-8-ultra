import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Faq } from "./Faq.tsx";
import { FAQ } from "./content.ts";

describe("Faq", () => {
  it("renders every question and opens the first answer by default", () => {
    render(<Faq />);
    for (const item of FAQ) {
      expect(
        screen.getByRole("button", { name: item.question }),
      ).toBeInTheDocument();
    }
    // First item is open by default → its answer is visible.
    expect(screen.getByText(FAQ[0].answer)).toBeInTheDocument();
  });

  it("expands a different item when its trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const secondTrigger = screen.getByRole("button", {
      name: FAQ[1].question,
    });
    expect(secondTrigger).toHaveAttribute("aria-expanded", "false");
    await user.click(secondTrigger);
    expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
    // Opening the second collapses the first (single-type accordion).
    expect(
      screen.getByRole("button", { name: FAQ[0].question }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses the open item when its trigger is clicked again", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const first = screen.getByRole("button", { name: FAQ[0].question });
    expect(first).toHaveAttribute("aria-expanded", "true");
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
  });
});
