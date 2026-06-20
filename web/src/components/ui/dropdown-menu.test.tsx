import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "./dropdown-menu.tsx";

function Example({ onSelect }: { onSelect?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuLabel inset>Inset label</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onSelect}>Edit</DropdownMenuItem>
          <DropdownMenuItem inset>Inset item</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Show grid</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("opens on trigger click and renders items, label, checkbox", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Inset label")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Inset item")).toBeInTheDocument();
    // checked checkbox item shows its indicator
    expect(screen.getByText("Show grid")).toBeInTheDocument();
  });

  it("invokes onSelect when an item is chosen", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Example onSelect={onSelect} />);
    await user.click(screen.getByText("Menu"));
    await user.click(screen.getByText("Edit"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("forwards classNames across content, item, label, checkbox, separator", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent className="c-content">
          <DropdownMenuLabel className="c-label">L</DropdownMenuLabel>
          <DropdownMenuSeparator className="c-sep" />
          <DropdownMenuItem className="c-item">I</DropdownMenuItem>
          <DropdownMenuCheckboxItem className="c-check">
            C
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("L")).toHaveClass("c-label");
    expect(screen.getByText("I")).toHaveClass("c-item");
    expect(screen.getByText("C")).toHaveClass("c-check");
    expect(screen.getByRole("separator")).toHaveClass("c-sep");
  });
});
