import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ActivityFeed } from "./ActivityFeed.tsx";
import type { Comment, User } from "../data/types.ts";

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

const NOW = Date.UTC(2026, 5, 20, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

function comment(
  id: string,
  author: User,
  body: string,
  createdAt: number,
  byAgent?: boolean,
): Comment {
  return { id, author, body, createdAt, byAgent };
}

describe("ActivityFeed", () => {
  it("renders an empty-state message when there are no comments", () => {
    render(<ActivityFeed comments={[]} now={NOW} />);
    expect(screen.getByTestId("activity-empty")).toHaveTextContent(
      "No activity yet",
    );
    expect(screen.queryByTestId("activity-feed")).not.toBeInTheDocument();
  });

  it("lists comments with author, relative timestamp, and body", () => {
    const comments = [comment("c1", human, "Looks great", NOW - HOUR)];
    render(<ActivityFeed comments={comments} now={NOW} />);

    const item = within(screen.getByTestId("activity-feed")).getByRole(
      "listitem",
    );
    expect(item).toHaveTextContent("Dawn Prompter");
    expect(item).toHaveTextContent("Looks great");
    expect(item).toHaveTextContent("1 hour ago");
  });

  it("preserves the given (newest-first) order without re-sorting", () => {
    // The store prepends, so the array is already descending; render verbatim.
    const comments = [
      comment("c-new", human, "Newest", NOW - HOUR),
      comment("c-old", human, "Oldest", NOW - 3 * HOUR),
    ];
    render(<ActivityFeed comments={comments} now={NOW} />);

    const items = within(screen.getByTestId("activity-feed")).getAllByRole(
      "listitem",
    );
    expect(items[0]).toHaveTextContent("Newest");
    expect(items[1]).toHaveTextContent("Oldest");
  });

  it("marks agent comments with a Rovo badge", () => {
    const comments = [
      comment("c-agent", agent, "Shipped it", NOW - HOUR, true),
      comment("c-human", human, "Reviewed", NOW - 2 * HOUR),
    ];
    render(<ActivityFeed comments={comments} now={NOW} />);

    // Exactly one agent badge — only the byAgent comment carries it.
    expect(screen.getAllByTestId("activity-agent-badge")).toHaveLength(1);
  });
});
