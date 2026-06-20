import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, badgeVariants } from "./badge.tsx";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("merges a custom className", () => {
    render(<Badge className="extra">x</Badge>);
    expect(screen.getByText("x")).toHaveClass("extra");
  });

  it("badgeVariants covers each variant", () => {
    expect(badgeVariants({ variant: "default" })).toContain("bg-primary");
    expect(badgeVariants({ variant: "secondary" })).toContain("bg-panel");
    expect(badgeVariants({ variant: "destructive" })).toContain(
      "bg-destructive",
    );
    expect(badgeVariants({ variant: "outline" })).toContain("text-foreground");
  });
});
