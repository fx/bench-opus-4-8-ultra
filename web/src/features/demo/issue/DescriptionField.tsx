import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "../../../components/ui/button.tsx";

// The issue-detail description field (see docs/changes/0006 › editable
// description; open-question default: click-to-edit inline). It reads as plain
// text until clicked, then swaps to a textarea with Save / Cancel. Editing is
// local component state committed up via `onSave` only on Save — Cancel and
// Escape discard, restoring the last saved text. A slot (`aiSlot`) hosts the 0007
// "✨ AI-generate description" action; it is shown ONLY in read mode (see the
// render below) so generating can't be clobbered by a stale in-progress draft.
//
// Keyboard: Cmd/Ctrl+Enter saves, Escape cancels — both standard for an inline
// editor — and every control carries a visible focus ring. The Escape-cancels
// behaviour matters inside the issue dialog, whose own Escape closes the modal:
// the field publishes its editing state via `onEditingChange` so the dialog can
// suppress its dismiss while the editor is open (the textarea's onKeyDown alone
// can't, since Radix listens for Escape in the capture phase on the document).

export interface DescriptionFieldProps {
  description: string;
  // Commit the edited description. Called only on an explicit Save.
  onSave: (description: string) => void;
  // Notified whenever the inline editor opens (true) or closes (false), so a
  // parent dialog can suppress its Escape-to-close while editing is active.
  onEditingChange?: (editing: boolean) => void;
  // 0007 slot: the "✨ AI-generate description" action, rendered beside the
  // field's heading. Omitted here; wired in the agent change.
  aiSlot?: ReactNode;
}

export function DescriptionField({
  description,
  onSave,
  onEditingChange,
  aiSlot,
}: DescriptionFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Move focus into the textarea when edit mode opens so keyboard users land in
  // the editor directly. Keyed ONLY on `editing` — seeding the draft is done at
  // the moment of entering edit mode (handleEdit), NOT here, so a later external
  // `description` change while editing does not clobber the in-progress draft.
  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
    }
  }, [editing]);

  // Publish editing transitions to the parent (e.g. the issue dialog) without
  // calling back during render. Runs on every `editing` flip.
  useEffect(() => {
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);

  // Enter edit mode, seeding the draft from the CURRENT description (read once,
  // here) so the editor opens with the latest saved text.
  function handleEdit() {
    setDraft(description);
    setEditing(true);
  }

  function handleSave() {
    onSave(draft);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSave();
    }
  }

  return (
    <section aria-label="Description" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Description</h3>
        {/* The "✨ AI-generate" action is offered ONLY in read mode. Generating
            while the inline editor is open would write the new text to the store
            but leave the textarea showing the stale local draft — a later Save
            would then silently overwrite the generated text. Hiding the slot
            during editing removes that footgun (the user generates from read mode,
            or edits manually, never both at once). */}
        {!editing && aiSlot}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            data-testid="description-textarea"
            aria-label="Edit description"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-testid="description-display"
          onClick={handleEdit}
          className="w-full whitespace-pre-wrap rounded-md border border-transparent px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-border hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {description.trim() === "" ? (
            <span className="text-muted-foreground">Add a description…</span>
          ) : (
            description
          )}
        </button>
      )}
    </section>
  );
}
