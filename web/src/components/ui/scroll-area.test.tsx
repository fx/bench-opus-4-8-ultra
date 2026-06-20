import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollArea, ScrollBar } from "./scroll-area.tsx";

describe("ScrollArea", () => {
  it("renders its children inside the viewport", () => {
    render(
      <ScrollArea className="c-area">
        <p>scrollable content</p>
      </ScrollArea>,
    );
    expect(screen.getByText("scrollable content")).toBeInTheDocument();
  });

  it("forwards the root className", () => {
    const { container } = render(
      <ScrollArea className="c-area">
        <p>x</p>
      </ScrollArea>,
    );
    expect(container.querySelector(".c-area")).not.toBeNull();
  });

  it("renders a horizontal scrollbar with the horizontal classes", () => {
    // type="always" forces Radix to render scrollbars even though jsdom cannot
    // measure overflow.
    const { container } = render(
      <ScrollArea type="always">
        <ScrollBar orientation="horizontal" className="c-bar" />
      </ScrollArea>,
    );
    const bar = container.querySelector(".c-bar") as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.className).toContain("flex-col");
  });

  it("defaults the standalone ScrollBar to vertical orientation", () => {
    const { container } = render(
      <ScrollArea type="always">
        <ScrollBar className="c-vbar" />
      </ScrollArea>,
    );
    const bar = container.querySelector(".c-vbar") as HTMLElement;
    expect(bar.className).toContain("w-2.5");
  });
});
