import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IssueTypeIcon } from "./IssueTypeIcon.tsx";
import { issueTypeLabel } from "./issue-meta.ts";
import type { IssueType } from "../data/types.ts";

const CASES: { type: IssueType; label: string; color: string }[] = [
  { type: "story", label: "Story", color: "rgb(101, 186, 67)" },
  { type: "task", label: "Task", color: "rgb(75, 173, 232)" },
  { type: "bug", label: "Bug", color: "rgb(229, 73, 58)" },
  { type: "epic", label: "Epic", color: "rgb(144, 78, 226)" },
  { type: "subtask", label: "Sub-task", color: "rgb(75, 173, 232)" },
];

describe("IssueTypeIcon", () => {
  it.each(CASES)(
    "renders the $type icon with its label and brand colour",
    ({ type, label, color }) => {
      render(<IssueTypeIcon type={type} />);
      const icon = screen.getByRole("img", { name: label });
      expect(icon).toHaveAttribute("data-type", type);
      expect(icon).toHaveStyle({ backgroundColor: color });
    },
  );

  it("forwards a custom className onto the chip", () => {
    render(<IssueTypeIcon type="story" className="custom-x" />);
    expect(screen.getByRole("img", { name: "Story" })).toHaveClass("custom-x");
  });

  it("issueTypeLabel returns the human-readable label", () => {
    expect(issueTypeLabel("bug")).toBe("Bug");
    expect(issueTypeLabel("subtask")).toBe("Sub-task");
  });
});
