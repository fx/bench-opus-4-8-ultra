import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo.tsx";

describe("Logo", () => {
  it("renders the inline SVG mark and the wordmark by default", () => {
    render(<Logo />);
    expect(
      screen.getByRole("img", { name: "Slop Simulator" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Slop Simulator")).toBeInTheDocument();
  });

  it("hides the wordmark text when showWordmark is false", () => {
    render(<Logo showWordmark={false} className="compact" />);
    expect(
      screen.getByRole("img", { name: "Slop Simulator" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Slop Simulator")).not.toBeInTheDocument();
  });
});
