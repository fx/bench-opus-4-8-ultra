import { useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../components/ui/dialog.tsx";
import { ScrollArea } from "../../../components/ui/scroll-area.tsx";
import { IssueTypeIcon } from "../board/IssueTypeIcon.tsx";
import { issueTypeLabel } from "../board/issue-meta.ts";
import type { Issue, Status } from "../data/types.ts";
import { selectSelectedIssue, useDemoStore } from "../store/store.ts";
import { ActivityFeed } from "./ActivityFeed.tsx";
import { CommentComposer } from "./CommentComposer.tsx";
import { DescriptionField } from "./DescriptionField.tsx";
import { DetailsPanel } from "./DetailsPanel.tsx";
import { StatusDropdown } from "./StatusDropdown.tsx";

// The issue detail view (see docs/changes/0006). A Jira-style full-issue modal
// (Dialog) opened by clicking a board card. Two columns: LEFT content — issue
// key/type header, summary, status dropdown, editable description, activity feed
// and comment composer; RIGHT a Details panel. Status changes and comments flow
// through the store (the SAME transition the board's drag uses), so the board
// stays in sync; closing returns to the board.
//
// 0007 slots (exposed, NOT implemented here):
//  - aiAgentSlot   — the right-hand streaming agent panel, rendered below Details.
//  - descriptionAiSlot / replyAiSlot — the "AI-generate" sparkle buttons.
// The slot props default to undefined so the detail renders cleanly today and the
// agent change plugs in without restructuring.

export interface IssueDetailProps {
  // Current time (epoch ms) for relative timestamps. Defaults to Date.now(); a
  // test injects a fixed value for deterministic "x ago" stamps.
  now?: number;
  // Clock used to STAMP mutations (comment/status/description). Defaults to the
  // live `Date.now` so a mutation always records the real wall-clock time —
  // crucially NOT the (possibly stale) render-time `now`, so a comment added
  // minutes after the modal opened reads "just now", not "N minutes ago". A test
  // injects a fixed clock to make the recorded timestamps deterministic.
  clock?: () => number;
  // 0007 slots — see file header. Optional render slots, omitted today.
  aiAgentSlot?: (issue: Issue) => ReactNode;
  descriptionAiSlot?: (issue: Issue) => ReactNode;
  replyAiSlot?: (issue: Issue) => ReactNode;
}

// IssueDetailContent renders the modal body for a CONCRETE issue. Split out from
// the open/close shell so the body only mounts when an issue is selected — its
// child fields can read the issue directly without null-guarding every line.
function IssueDetailContent({
  issue,
  now,
  clock,
  onDescriptionEditingChange,
  aiAgentSlot,
  descriptionAiSlot,
  replyAiSlot,
}: {
  issue: Issue;
  now: number;
  clock: () => number;
  onDescriptionEditingChange: (editing: boolean) => void;
  aiAgentSlot?: (issue: Issue) => ReactNode;
  descriptionAiSlot?: (issue: Issue) => ReactNode;
  replyAiSlot?: (issue: Issue) => ReactNode;
}) {
  const setStatus = useDemoStore((state) => state.setStatus);
  const setDescription = useDemoStore((state) => state.setDescription);
  const addComment = useDemoStore((state) => state.addComment);

  function handleStatusChange(status: Status) {
    setStatus(issue.key, status, clock);
  }

  return (
    <div className="flex max-h-[80vh] flex-col">
      {/* Header: type icon · key · status dropdown. */}
      <div className="flex items-center gap-2 border-b border-border pb-3 pr-8">
        <IssueTypeIcon type={issue.type} />
        <span className="text-sm font-semibold tracking-wide text-muted-foreground">
          {issue.key}
        </span>
        <span className="sr-only">{issueTypeLabel(issue.type)}</span>
        <div className="ml-auto">
          <StatusDropdown status={issue.status} onChange={handleStatusChange} />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-6 p-1 pt-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          {/* LEFT content column. */}
          <div className="flex min-w-0 flex-col gap-6">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {issue.summary}
            </DialogTitle>
            {/* A visually-hidden description satisfies Radix's a11y
                requirement that a Dialog be described; it names the issue. */}
            <DialogDescription className="sr-only">
              Issue {issue.key}: {issue.summary}
            </DialogDescription>

            <DescriptionField
              description={issue.description}
              onSave={(description) =>
                setDescription(issue.key, description, clock)
              }
              onEditingChange={onDescriptionEditingChange}
              aiSlot={descriptionAiSlot?.(issue)}
            />

            <section aria-label="Activity" className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Activity
              </h3>
              <CommentComposer
                onSubmit={(body) => addComment(issue.key, body, clock)}
                aiSlot={replyAiSlot?.(issue)}
              />
              <ActivityFeed comments={issue.comments} now={now} />
            </section>
          </div>

          {/* RIGHT details column (+ 0007 agent slot). */}
          <div className="flex flex-col gap-4">
            <DetailsPanel issue={issue} now={now} />
            {aiAgentSlot?.(issue)}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function IssueDetail({
  now = Date.now(),
  clock = Date.now,
  aiAgentSlot,
  descriptionAiSlot,
  replyAiSlot,
}: IssueDetailProps) {
  const issue = useDemoStore(selectSelectedIssue);
  const closeIssue = useDemoStore((state) => state.closeIssue);

  // Whether the inline description editor is open. While it is, the dialog must
  // NOT close on Escape — Escape should cancel the edit instead. Tracked here (at
  // the dialog) because Radix dismisses on a document-level capture listener that
  // a descendant textarea's onKeyDown can't pre-empt; only the dialog's
  // onEscapeKeyDown can. The DescriptionField publishes its state up.
  const [editingDescription, setEditingDescription] = useState(false);

  // Radix Dialog is controlled off whether an issue is selected. onOpenChange
  // fires with false on overlay click, Escape, or the close button — all route
  // through closeIssue so the single store flag is the source of truth. Reset the
  // editing flag on close so a reopened issue starts in read mode.
  function handleOpenChange(open: boolean) {
    if (!open) {
      setEditingDescription(false);
      closeIssue();
    }
  }

  return (
    <Dialog open={issue !== undefined} onOpenChange={handleOpenChange}>
      {issue && (
        <DialogContent
          data-testid="issue-detail"
          className="max-w-3xl gap-0 p-5"
          // Suppress the dialog's Escape-to-close while the description editor is
          // open: preventDefault stops Radix dismissing, leaving the editor's own
          // Escape handler to cancel the edit. (The editor stopping propagation
          // wouldn't work — Radix listens in the capture phase.)
          onEscapeKeyDown={(event) => {
            if (editingDescription) {
              event.preventDefault();
            }
          }}
        >
          <IssueDetailContent
            issue={issue}
            now={now}
            clock={clock}
            onDescriptionEditingChange={setEditingDescription}
            aiAgentSlot={aiAgentSlot}
            descriptionAiSlot={descriptionAiSlot}
            replyAiSlot={replyAiSlot}
          />
          {/* DialogContent renders its own close button (top-right), which
              fires onOpenChange(false) → closeIssue. We expose an explicit
              hidden close target too so tests/assistive tech can address it. */}
          <DialogClose className="sr-only">Close issue detail</DialogClose>
        </DialogContent>
      )}
    </Dialog>
  );
}
