import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AssigneeAvatar,
  EpicLozenge,
  LabelLozenge,
  StoryPoints,
} from "./CardMeta.tsx";
import type { User } from "../data/types.ts";

const human: User = {
  id: "u1",
  name: "Dawn Prompter",
  initials: "DP",
  avatarColor: "#0052CC",
};
const agent: User = {
  id: "rovo",
  name: "Rovo Ultra",
  initials: "RU",
  avatarColor: "#6554C0",
  isAgent: true,
};

describe("StoryPoints", () => {
  it("renders the points value with an accessible label", () => {
    render(<StoryPoints points={8} />);
    const badge = screen.getByLabelText("8 story points");
    expect(badge).toHaveTextContent("8");
  });

  it("forwards a custom className", () => {
    render(<StoryPoints points={3} className="pts-x" />);
    expect(screen.getByLabelText("3 story points")).toHaveClass("pts-x");
  });
});

describe("AssigneeAvatar", () => {
  it("renders a human assignee's initials avatar without the agent ring", () => {
    render(<AssigneeAvatar user={human} />);
    const avatar = screen.getByLabelText("Assignee: Dawn Prompter");
    expect(avatar).not.toHaveClass("ring-2");
  });

  it("adds a violet ring for the agent assignee", () => {
    render(<AssigneeAvatar user={agent} />);
    expect(screen.getByLabelText("Assignee: Rovo Ultra")).toHaveClass("ring-2");
  });

  it("renders a dashed placeholder when unassigned", () => {
    render(<AssigneeAvatar user={null} />);
    expect(screen.getByLabelText("Unassigned")).toBeInTheDocument();
  });

  it("forwards a custom className for an assigned user", () => {
    render(<AssigneeAvatar user={human} className="av-x" />);
    expect(screen.getByLabelText("Assignee: Dawn Prompter")).toHaveClass(
      "av-x",
    );
  });

  it("forwards a custom className for the unassigned placeholder", () => {
    render(<AssigneeAvatar user={null} className="av-y" />);
    expect(screen.getByLabelText("Unassigned")).toHaveClass("av-y");
  });
});

describe("LabelLozenge", () => {
  it("renders the label text", () => {
    render(<LabelLozenge label="agentic" />);
    expect(screen.getByText("agentic")).toBeInTheDocument();
  });

  it("forwards a custom className", () => {
    render(<LabelLozenge label="ux" className="lab-x" />);
    expect(screen.getByText("ux")).toHaveClass("lab-x");
  });
});

describe("EpicLozenge", () => {
  it("renders the epic name on its brand colour", () => {
    render(<EpicLozenge epic={{ name: "Slop Engine", color: "#6554C0" }} />);
    const chip = screen.getByText("Slop Engine");
    expect(chip).toHaveStyle({ backgroundColor: "rgb(101, 84, 192)" });
  });

  it("forwards a custom className", () => {
    render(
      <EpicLozenge
        epic={{ name: "Hype", color: "#00857A" }}
        className="epic-x"
      />,
    );
    expect(screen.getByText("Hype")).toHaveClass("epic-x");
  });
});
