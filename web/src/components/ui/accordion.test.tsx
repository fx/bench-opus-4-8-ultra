import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion.tsx";

function Example() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="one" className="c-item">
        <AccordionTrigger className="c-trigger">Question</AccordionTrigger>
        <AccordionContent className="c-content">Answer</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("expands content when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Question" });
    expect(trigger).toHaveAttribute("data-state", "closed");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Answer")).toBeInTheDocument();
  });

  it("collapses again on a second click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Question" });
    await user.click(trigger);
    await user.click(trigger);
    expect(trigger).toHaveAttribute("data-state", "closed");
  });

  it("forwards classNames to item, trigger, content", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Question" });
    expect(trigger).toHaveClass("c-trigger");
    await user.click(trigger);
    expect(screen.getByText("Answer")).toHaveClass("c-content");
  });
});
