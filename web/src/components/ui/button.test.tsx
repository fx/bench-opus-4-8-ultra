import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "./button.tsx";

describe("Button", () => {
  it("renders a button with its children", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("merges a custom className", () => {
    render(<Button className="custom">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("renders as a child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/demo">link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "link" });
    expect(link).toHaveAttribute("href", "/demo");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("buttonVariants produces classes for each variant and size", () => {
    expect(buttonVariants({ variant: "destructive" })).toContain(
      "bg-destructive",
    );
    expect(buttonVariants({ variant: "outline" })).toContain("border");
    expect(buttonVariants({ variant: "secondary" })).toContain("bg-panel");
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-accent");
    expect(buttonVariants({ variant: "link" })).toContain("underline-offset-4");
    expect(buttonVariants({ size: "sm" })).toContain("h-8");
    expect(buttonVariants({ size: "lg" })).toContain("h-10");
    expect(buttonVariants({ size: "icon" })).toContain("w-9");
  });
});
