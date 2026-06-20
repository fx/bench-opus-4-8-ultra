import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip.tsx";

function Example() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent className="c-tip">Tip text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  it("shows content on hover", async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.queryByText("Tip text")).toBeNull();
    await user.hover(screen.getByText("Hover me"));
    // Radix renders the tooltip content (possibly duplicated for a11y); at
    // least one instance with the forwarded class must appear.
    const tips = await screen.findAllByText("Tip text");
    expect(tips.length).toBeGreaterThan(0);
    expect(document.querySelector(".c-tip")).not.toBeNull();
  });
});
