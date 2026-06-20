import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input.tsx";

describe("Input", () => {
  it("renders and accepts typed text", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="email" />);
    const input = screen.getByPlaceholderText("email");
    await user.type(input, "hi");
    expect(input).toHaveValue("hi");
  });

  it("honors the type attribute", () => {
    render(<Input type="password" aria-label="pw" />);
    expect(screen.getByLabelText("pw")).toHaveAttribute("type", "password");
  });

  it("merges a custom className", () => {
    render(<Input aria-label="f" className="wide" />);
    expect(screen.getByLabelText("f")).toHaveClass("wide");
  });

  it("can be disabled", () => {
    render(<Input aria-label="d" disabled />);
    expect(screen.getByLabelText("d")).toBeDisabled();
  });
});
