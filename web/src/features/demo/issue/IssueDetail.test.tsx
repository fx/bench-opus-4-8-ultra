import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeScope } from "../../../components/ThemeScope.tsx";
import { IssueDetail } from "./IssueDetail.tsx";
import {
  selectIssueByKey,
  selectIssuesByStatus,
  selectStatusCounts,
  useDemoStore,
} from "../store/store.ts";

// A fixed clock so timestamps in the modal are deterministic. After the seed
// epoch so seed stamps read as past ("x ago"), not "just now".
const NOW = Date.UTC(2026, 6, 1, 12, 0, 0);

// IssueDetail's portalled content (Radix Dialog) needs the Jira theme scope to
// resolve themed tokens; wrap every render so it mirrors the live AppShell mount.
// Inject BOTH the display `now` and the mutation `clock` at the same fixed value
// so a freshly-added comment reads "just now" and recorded timestamps are
// deterministic.
function renderDetail() {
  return render(
    <ThemeScope theme="jira">
      <IssueDetail now={NOW} clock={() => NOW} />
    </ThemeScope>,
  );
}

beforeEach(() => {
  useDemoStore.getState().reset();
});

describe("IssueDetail — closed by default", () => {
  it("renders nothing visible until an issue is selected", () => {
    renderDetail();
    expect(screen.queryByTestId("issue-detail")).not.toBeInTheDocument();
  });

  it("renders nothing when the selected key resolves to no issue", () => {
    act(() => {
      useDemoStore.getState().openIssue("SLOP-000");
    });
    renderDetail();
    expect(screen.queryByTestId("issue-detail")).not.toBeInTheDocument();
  });
});

describe("IssueDetail — open from a selected key", () => {
  it("shows the selected issue's key, summary, status, and details", () => {
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    renderDetail();

    const modal = screen.getByTestId("issue-detail");
    expect(modal).toHaveTextContent("SLOP-101");
    expect(modal).toHaveTextContent("Generate infinite AI slop with one click");
    // Status lozenge reflects the seed status (todo → "To Do").
    expect(screen.getByTestId("status-dropdown-trigger")).toHaveTextContent(
      "To Do",
    );
    // The Details panel renders the seeded assignee.
    expect(screen.getByTestId("details-panel")).toHaveTextContent(
      "Dawn Prompter",
    );
  });
});

describe("IssueDetail — status transition syncs the board", () => {
  it("changing status to Done moves the issue into the board's Done column", async () => {
    const user = userEvent.setup();
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    renderDetail();

    const beforeCounts = selectStatusCounts(useDemoStore.getState());
    const beforeDone = selectIssuesByStatus(useDemoStore.getState(), "done");

    await user.click(screen.getByTestId("status-dropdown-trigger"));
    await user.click(screen.getByTestId("status-option-done"));

    // Store reflects the new column — the board reads the same state.
    const moved = selectIssueByKey(useDemoStore.getState(), "SLOP-101");
    expect(moved?.status).toBe("done");
    const afterDone = selectIssuesByStatus(useDemoStore.getState(), "done");
    expect(afterDone.map((i) => i.key)).toContain("SLOP-101");
    expect(afterDone.length).toBe(beforeDone.length + 1);
    const afterCounts = selectStatusCounts(useDemoStore.getState());
    expect(afterCounts.todo).toBe(beforeCounts.todo - 1);
    expect(afterCounts.done).toBe(beforeCounts.done + 1);

    // The open modal's lozenge updates to the new status too.
    expect(screen.getByTestId("status-dropdown-trigger")).toHaveTextContent(
      "Done",
    );
  });
});

describe("IssueDetail — comments", () => {
  it("adds a comment that appears at the top of the activity feed with author + time", async () => {
    const user = userEvent.setup();
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    renderDetail();

    await user.type(screen.getByTestId("comment-input"), "Shipping this now");
    await user.click(screen.getByTestId("comment-submit"));

    const feed = screen.getByTestId("activity-feed");
    const items = within(feed).getAllByRole("listitem");
    // Prepended: the new comment is the first feed item.
    expect(items[0]).toHaveTextContent("Shipping this now");
    expect(items[0]).toHaveTextContent("just now");
    // Authored by a non-agent teammate from the seed.
    const added = selectIssueByKey(useDemoStore.getState(), "SLOP-101")
      ?.comments[0];
    expect(added?.author.isAgent).toBeFalsy();
  });

  it("shows the empty activity state for an issue with no comments", () => {
    act(() => {
      // SLOP-102 is seeded with no comments.
      useDemoStore.getState().openIssue("SLOP-102");
    });
    renderDetail();
    expect(screen.getByTestId("activity-empty")).toBeInTheDocument();
  });

  it("renders every comment when several are added under the same (fixed) clock", async () => {
    // Regression guard for duplicate comment ids: with renderDetail injecting one
    // fixed clock, three submissions must each get a distinct id and all render
    // (ActivityFeed keys its list on comment.id — a collision would drop rows).
    const user = userEvent.setup();
    act(() => {
      // SLOP-102 starts empty, so the feed holds exactly what we add.
      useDemoStore.getState().openIssue("SLOP-102");
    });
    renderDetail();

    for (const body of ["alpha", "beta", "gamma"]) {
      await user.type(screen.getByTestId("comment-input"), body);
      await user.click(screen.getByTestId("comment-submit"));
    }

    const feed = screen.getByTestId("activity-feed");
    const items = within(feed).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    // Newest-first ordering preserved across same-clock adds.
    expect(items[0]).toHaveTextContent("gamma");
    expect(items[2]).toHaveTextContent("alpha");
    // All three persisted ids are distinct.
    const ids = selectIssueByKey(
      useDemoStore.getState(),
      "SLOP-102",
    )!.comments.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });
});

describe("IssueDetail — inline description edit", () => {
  it("persists an edited description to the store", async () => {
    const user = userEvent.setup();
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    renderDetail();

    await user.click(screen.getByTestId("description-display"));
    const textarea = screen.getByTestId("description-textarea");
    await user.clear(textarea);
    await user.type(textarea, "A crisper description");
    // Two "Save" buttons exist (description + comment composer); scope to the
    // Description section so we click the right one.
    const descriptionSection = screen.getByRole("region", {
      name: "Description",
    });
    await user.click(
      within(descriptionSection).getByRole("button", { name: "Save" }),
    );

    expect(
      selectIssueByKey(useDemoStore.getState(), "SLOP-101")?.description,
    ).toBe("A crisper description");
  });

  it("Escape while editing the description cancels the edit WITHOUT closing the modal", async () => {
    const user = userEvent.setup();
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    renderDetail();

    await user.click(screen.getByTestId("description-display"));
    const textarea = screen.getByTestId("description-textarea");
    await user.type(textarea, " extra");
    await user.keyboard("{Escape}");

    // The modal stays open (Escape was consumed by the editor, not the dialog)…
    expect(screen.getByTestId("issue-detail")).toBeInTheDocument();
    expect(useDemoStore.getState().selectedIssueKey).toBe("SLOP-101");
    // …the edit is discarded (back to read mode, store untouched)…
    expect(
      screen.queryByTestId("description-textarea"),
    ).not.toBeInTheDocument();
    expect(
      selectIssueByKey(useDemoStore.getState(), "SLOP-101")?.description,
    ).not.toContain("extra");

    // …and a SECOND Escape (now in read mode) closes the modal normally.
    await user.keyboard("{Escape}");
    expect(useDemoStore.getState().selectedIssueKey).toBeNull();
  });
});

describe("IssueDetail — close", () => {
  it("closes via Escape, clearing the store selection", async () => {
    const user = userEvent.setup();
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    renderDetail();
    expect(screen.getByTestId("issue-detail")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(useDemoStore.getState().selectedIssueKey).toBeNull();
    expect(screen.queryByTestId("issue-detail")).not.toBeInTheDocument();
  });

  it("exposes exactly ONE accessible, focusable close button (the built-in X) and it closes the modal", async () => {
    const user = userEvent.setup();
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    renderDetail();

    // Only the DialogContent's built-in close exists — no redundant sr-only
    // DialogClose adding a second (invisible) tab stop.
    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    expect(closeButtons).toHaveLength(1);

    // It is focusable (no negative tabindex) and clicking it closes the modal.
    const close = closeButtons[0];
    expect(close).not.toHaveAttribute("tabindex", "-1");
    close.focus();
    expect(close).toHaveFocus();
    await user.click(close);
    expect(useDemoStore.getState().selectedIssueKey).toBeNull();
  });
});

describe("IssueDetail — 0007 slots", () => {
  it("renders the agent, description-AI, and reply-AI slots when provided", () => {
    act(() => {
      useDemoStore.getState().openIssue("SLOP-101");
    });
    render(
      <ThemeScope theme="jira">
        <IssueDetail
          now={NOW}
          aiAgentSlot={(issue) => (
            <div data-testid="agent-slot">{issue.key} agent</div>
          )}
          descriptionAiSlot={() => <button>Gen description</button>}
          replyAiSlot={() => <button>Reply with AI</button>}
        />
      </ThemeScope>,
    );

    expect(screen.getByTestId("agent-slot")).toHaveTextContent(
      "SLOP-101 agent",
    );
    expect(
      screen.getByRole("button", { name: "Gen description" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reply with AI" }),
    ).toBeInTheDocument();
  });
});

describe("IssueDetail — default now / clock", () => {
  it("uses Date.now() for both display and mutations when neither prop is given", async () => {
    const user = userEvent.setup();
    // Drive the `now = Date.now()` and `clock = Date.now` default-parameter
    // branches: with Date.now pinned, a fresh comment is stamped at NOW and reads
    // "just now".
    const spy = vi.spyOn(Date, "now").mockReturnValue(NOW);
    act(() => {
      useDemoStore.getState().openIssue("SLOP-102");
    });
    render(
      <ThemeScope theme="jira">
        <IssueDetail />
      </ThemeScope>,
    );
    expect(screen.getByTestId("issue-detail")).toBeInTheDocument();

    await user.type(
      screen.getByTestId("comment-input"),
      "default-clock comment",
    );
    await user.click(screen.getByTestId("comment-submit"));

    const added = selectIssueByKey(useDemoStore.getState(), "SLOP-102")
      ?.comments[0];
    expect(added?.createdAt).toBe(NOW);
    expect(screen.getByTestId("activity-feed")).toHaveTextContent("just now");
    spy.mockRestore();
  });
});

afterEach(() => {
  // Ensure a clean store between cases (also covered by beforeEach reset).
  useDemoStore.getState().closeIssue();
});
