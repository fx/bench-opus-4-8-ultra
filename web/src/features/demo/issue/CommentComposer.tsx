import { useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { Button } from "../../../components/ui/button.tsx";

// The issue-detail comment composer (see docs/changes/0006 › Comments). A small
// textarea + Save button that adds a (mock) comment via `onSubmit`; the store
// prepends it so it lands at the top of the activity feed. Empty / whitespace-only
// input is rejected (the Save button disables and submit no-ops) so the feed never
// gains a blank entry. Cmd/Ctrl+Enter submits for keyboard users.
//
// `aiSlot` exposes the 0007 "✨ Reply with AI" action without implementing it.

export interface CommentComposerProps {
  // Add the comment. The composer clears its draft on a successful submit.
  onSubmit: (body: string) => void;
  // 0007 slot: the "✨ Reply with AI" action, rendered in the composer's action
  // row. Omitted here; wired in the agent change.
  aiSlot?: ReactNode;
}

export function CommentComposer({ onSubmit, aiSlot }: CommentComposerProps) {
  const [draft, setDraft] = useState("");
  const canSubmit = draft.trim() !== "";

  function submit() {
    if (!canSubmit) {
      return;
    }
    onSubmit(draft);
    setDraft("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      aria-label="Add a comment"
      onSubmit={handleSubmit}
      className="flex flex-col gap-2"
    >
      <textarea
        data-testid="comment-input"
        aria-label="Comment"
        placeholder="Add a comment…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          data-testid="comment-submit"
        >
          Save
        </Button>
        {aiSlot}
      </div>
    </form>
  );
}
