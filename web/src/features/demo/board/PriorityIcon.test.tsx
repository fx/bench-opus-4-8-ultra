import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityIcon } from "./PriorityIcon.tsx";
import { priorityLabel } from "./issue-meta.ts";
import type { Priority } from "../data/types.ts";

const CASES: { priority: Priority; label: string; color: string }[] = [
  { priority: "highest", label: "Highest", color: "rgb(205, 19, 22)" },
  { priority: "high", label: "High", color: "rgb(229, 73, 58)" },
  { priority: "medium", label: "Medium", color: "rgb(233, 127, 51)" },
  { priority: "low", label: "Low", color: "rgb(45, 135, 56)" },
  { priority: "lowest", label: "Lowest", color: "rgb(0, 101, 255)" },
];

describe("PriorityIcon", () => {
  it.each(CASES)(
    "renders the $priority chevron with its label and colour",
    ({ priority, label, color }) => {
      render(<PriorityIcon priority={priority} />);
      const icon = screen.getByRole("img", { name: `${label} priority` });
      expect(icon).toHaveAttribute("data-priority", priority);
      expect(icon).toHaveStyle({ color });
    },
  );

  it("forwards a custom className", () => {
    render(<PriorityIcon priority="high" className="custom-y" />);
    expect(screen.getByRole("img", { name: "High priority" })).toHaveClass(
      "custom-y",
    );
  });

  it("priorityLabel returns the human-readable label", () => {
    expect(priorityLabel("highest")).toBe("Highest");
    expect(priorityLabel("lowest")).toBe("Lowest");
  });
});
