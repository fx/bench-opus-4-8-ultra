import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DetailsPanel } from "./DetailsPanel.tsx";
import type { Issue, User } from "../data/types.ts";

const dawn: User = {
  id: "dawn",
  name: "Dawn Prompter",
  initials: "DP",
  avatarColor: "#0052CC",
};
const grant: User = {
  id: "grant",
  name: "Grant Funding",
  initials: "GF",
  avatarColor: "#C9372C",
};

const NOW = Date.UTC(2026, 5, 20, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

// A fully-populated issue: every optional field present.
const fullIssue: Issue = {
  key: "SLOP-101",
  type: "story",
  summary: "Generate infinite slop",
  description: "desc",
  status: "todo",
  priority: "highest",
  storyPoints: 8,
  assignee: dawn,
  reporter: grant,
  labels: ["flagship", "slop-core"],
  epic: { name: "Slop Engine", color: "#6554C0" },
  comments: [],
  createdAt: Date.UTC(2026, 5, 1, 9, 0, 0),
  updatedAt: NOW - HOUR,
};

// The same shape with every optional field at its empty/null variant.
const sparseIssue: Issue = {
  ...fullIssue,
  key: "SLOP-104",
  storyPoints: null,
  assignee: null,
  labels: [],
  epic: undefined,
};

// Read a field's value cell by its label, so assertions target the right row.
function fieldValue(label: string): HTMLElement {
  const panel = screen.getByTestId("details-panel");
  const dt = within(panel).getByText(label);
  // The <dd> value is the dt's next element sibling.
  return dt.nextElementSibling as HTMLElement;
}

describe("DetailsPanel — fully populated issue", () => {
  it("renders every field with its value", () => {
    render(<DetailsPanel issue={fullIssue} now={NOW} />);

    expect(fieldValue("Assignee")).toHaveTextContent("Dawn Prompter");
    expect(fieldValue("Reporter")).toHaveTextContent("Grant Funding");
    expect(fieldValue("Priority")).toHaveTextContent("Highest");
    expect(fieldValue("Labels")).toHaveTextContent("flagship");
    expect(fieldValue("Labels")).toHaveTextContent("slop-core");
    expect(fieldValue("Story points")).toHaveTextContent("8");
    expect(fieldValue("Sprint")).toHaveTextContent("SLOP Sprint 7");
    expect(fieldValue("Epic")).toHaveTextContent("Slop Engine");
    expect(fieldValue("Created")).toHaveTextContent("Jun 1, 2026");
    expect(fieldValue("Updated")).toHaveTextContent("1 hour ago");
  });
});

describe("DetailsPanel — sparse issue (null/optional fields)", () => {
  it("renders placeholders for unassigned, no points, no labels, and no epic", () => {
    render(<DetailsPanel issue={sparseIssue} now={NOW} />);

    expect(fieldValue("Assignee")).toHaveTextContent("Unassigned");
    expect(fieldValue("Story points")).toHaveTextContent("None");
    expect(fieldValue("Labels")).toHaveTextContent("None");
    expect(fieldValue("Epic")).toHaveTextContent("None");
    // Sprint is always present even with no data fields.
    expect(fieldValue("Sprint")).toHaveTextContent("SLOP Sprint 7");
  });
});
