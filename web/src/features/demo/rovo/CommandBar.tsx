import { useState } from "react";
import type { FormEvent } from "react";
import { Quote, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.tsx";
import { Button } from "../../../components/ui/button.tsx";
import { Input } from "../../../components/ui/input.tsx";
import { useDemoStore } from "../store/store.ts";

// The "Ask Rovo Anything" command bar (see docs/changes/0007 › Ask Rovo). The
// top-nav entry opens a Dialog with a query input; submitting any query shows an
// over-confident, citation-laden, absurd SCRIPTED answer (store.askRovo →
// ask-rovo.ts). No LLM, no network — the answer is selected deterministically
// from the query. Closing the dialog clears the answer so a re-open starts fresh.
//
// CONTRAST: all chrome uses theme tokens (foreground / muted-foreground / primary
// on panel) — no hardcoded text-on-color is introduced. The "Ask Rovo" trigger,
// Ask button, input, and citation chips all derive AA-safe colours from the Jira
// theme + design-system primitives (focus rings included).

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const answer = useDemoStore((state) => state.rovoAnswer);
  const askRovo = useDemoStore((state) => state.askRovo);
  const clearRovoAnswer = useDemoStore((state) => state.clearRovoAnswer);

  // The Ask button is disabled until there's a non-whitespace query, mirroring
  // the comment composer's submit-gating. Trimmed so spaces-only doesn't enable
  // it; the same guard short-circuits a submit (e.g. Enter) on an empty query.
  const canAsk = query.trim() !== "";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canAsk) {
      return;
    }
    askRovo(query);
  }

  // On close, clear both the answer and the input so the next open is pristine.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      clearRovoAnswer();
      setQuery("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-primary/30 font-medium text-primary"
          aria-label="Ask Rovo"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="hidden lg:inline">Ask Rovo</span>
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="ask-rovo" className="max-w-lg gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <DialogTitle className="text-base font-semibold text-foreground">
            Ask Rovo Anything
          </DialogTitle>
        </div>
        <DialogDescription className="sr-only">
          Ask the Rovo AI assistant a question and receive a (parody) answer.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            data-testid="ask-rovo-input"
            aria-label="Ask Rovo a question"
            placeholder="Ask Rovo anything…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <Button
            type="submit"
            size="sm"
            disabled={!canAsk}
            data-testid="ask-rovo-submit"
          >
            Ask
          </Button>
        </form>

        {answer && (
          <div
            data-testid="ask-rovo-answer"
            aria-live="polite"
            className="flex flex-col gap-2 rounded-md border border-border bg-panel p-3"
          >
            <p className="text-sm text-foreground">{answer.body}</p>
            <p className="text-xs font-medium text-primary">
              Confidence: {answer.confidence}%
            </p>
            <ul className="flex flex-col gap-1">
              {answer.citations.map((citation) => (
                <li
                  key={citation}
                  data-testid="ask-rovo-citation"
                  className="flex items-start gap-1.5 rounded-sm bg-background px-2 py-1 text-[11px] text-muted-foreground"
                >
                  <Quote
                    className="mt-0.5 h-3 w-3 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">{citation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
