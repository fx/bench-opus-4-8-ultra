import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
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
// 0007 slots (exposed; wired by the AppShell):
//  - aiAgentSlot      — the right-hand streaming agent panel, rendered below Details.
//  - summaryAiSlot    — the "✨ AI-generate summary" action, beside the title.
//  - descriptionAiSlot / replyAiSlot — the "AI-generate" sparkle buttons.
// The slot props default to undefined so the detail renders cleanly without them.

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
  // 0007 slots — see file header. Optional render slots, omitted by default.
  aiAgentSlot?: (issue: Issue) => ReactNode;
  summaryAiSlot?: (issue: Issue) => ReactNode;
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
  summaryAiSlot,
  descriptionAiSlot,
  replyAiSlot,
}: {
  issue: Issue;
  now: number;
  clock: () => number;
  onDescriptionEditingChange: (editing: boolean) => void;
  aiAgentSlot?: (issue: Issue) => ReactNode;
  summaryAiSlot?: (issue: Issue) => ReactNode;
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
            <div className="flex items-start justify-between gap-2">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {issue.summary}
              </DialogTitle>
              {summaryAiSlot && (
                <div className="shrink-0">{summaryAiSlot(issue)}</div>
              )}
            </div>
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
  summaryAiSlot,
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

  // Remember which issue key was open so focus can be restored to ITS board card
  // on close. We can't lean on Radix's built-in focus-return: the dialog content
  // is conditionally rendered off `issue`, so closing unmounts it (the store
  // clears the key) before Radix runs its restore — and the board Card is a
  // role=button div that a mouse click doesn't natively focus anyway. The ref
  // survives that unmount; onCloseAutoFocus uses it to focus the card explicitly.
  // onCloseAutoFocus only fires after the dialog was open (issue was truthy), so
  // the ref is always set by the time it runs — initialised to "" purely to
  // satisfy the type (an empty key never matches a card).
  const lastKeyRef = useRef<string>("");
  if (issue) {
    lastKeyRef.current = issue.key;
  }

  // On close, return focus to the card that opened the modal (found by its
  // data-issue-key). preventDefault stops Radix's own (here ineffective) restore.
  // If the card isn't in the DOM (e.g. detail rendered without a board), Radix's
  // default focus handling stands.
  function handleCloseAutoFocus(event: Event) {
    const card = document.querySelector<HTMLElement>(
      `[data-issue-key="${lastKeyRef.current}"]`,
    );
    if (card) {
      event.preventDefault();
      card.focus();
    }
  }

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
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          {/* DialogContent renders its own accessible, visibly-focusable close
              button (top-right X with an sr-only "Close" label), which fires
              onOpenChange(false) → closeIssue. We rely on that single control —
              an extra sr-only DialogClose would add an invisible tab stop with no
              visible focus indicator, so it is intentionally NOT rendered. */}
          <IssueDetailContent
            issue={issue}
            now={now}
            clock={clock}
            onDescriptionEditingChange={setEditingDescription}
            aiAgentSlot={aiAgentSlot}
            summaryAiSlot={summaryAiSlot}
            descriptionAiSlot={descriptionAiSlot}
            replyAiSlot={replyAiSlot}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
