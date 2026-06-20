import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch.tsx";

describe("Switch", () => {
  it("toggles on click and reports state", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch onCheckedChange={onCheckedChange} aria-label="wifi" />);
    const sw = screen.getByRole("switch", { name: "wifi" });
    expect(sw).toHaveAttribute("data-state", "unchecked");
    await user.click(sw);
    expect(sw).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("merges a custom className", () => {
    render(<Switch className="c-switch" aria-label="x" />);
    expect(screen.getByRole("switch")).toHaveClass("c-switch");
  });

  it("does not toggle when disabled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Switch disabled onCheckedChange={onCheckedChange} aria-label="d" />,
    );
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
