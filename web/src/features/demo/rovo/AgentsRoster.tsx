import { useState } from "react";
import { Bot, Check, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar.tsx";
import { Button } from "../../../components/ui/button.tsx";
import { cn } from "../../../lib/cn.ts";
import { ROSTER_AGENTS, type RosterAgent } from "./roster.ts";

// The Rovo Agents roster page (see docs/changes/0007 › Rovo Agents roster). A
// sidebar destination listing absurd hireable parody agents with fabricated
// utilization/shipped stats and Hire / Assign actions. Hiring is purely local UI
// state (a Set of hired ids) — there is no real backend; "Assign" just flips a
// per-agent assigned flag for the joke. Deterministic content from roster.ts.
//
// CONTRAST: each agent avatar paints WHITE initials on `avatarColor`, all of
// which are AA-guarded by roster-contrast.test.ts. The utilization badge uses
// dark slate text on a light theme tint (panel/muted tokens, NOT white-on-color),
// so it carries no white-on-color requirement. Hire/Assign buttons are design-
// system primitives (primary / outline) with their own focus rings + AA colours.

// A single agent card. Local hire/assign state is lifted to the roster so the
// header count reflects hires; this row just renders + dispatches.
function AgentCard({
  agent,
  hired,
  assigned,
  onHire,
  onAssign,
}: {
  agent: RosterAgent;
  hired: boolean;
  assigned: boolean;
  onHire: (id: string) => void;
  onAssign: (id: string) => void;
}) {
  return (
    <li
      data-testid="roster-agent"
      data-agent-id={agent.id}
      className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 text-white">
          <AvatarFallback
            className="text-sm font-semibold text-white"
            style={{ backgroundColor: agent.avatarColor }}
          >
            {agent.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {agent.name}
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {agent.tagline}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-sm bg-panel px-1.5 py-0.5 font-medium text-muted-foreground">
          Utilization {agent.utilization}%
        </span>
        <span className="rounded-sm bg-panel px-1.5 py-0.5 font-medium text-muted-foreground">
          {agent.shipped.toLocaleString()} shipped
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={hired ? "outline" : "default"}
          onClick={() => onHire(agent.id)}
          data-testid="roster-hire"
          aria-pressed={hired}
          className="gap-1.5"
        >
          {hired ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Hired
            </>
          ) : (
            "Hire"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onAssign(agent.id)}
          disabled={!hired}
          data-testid="roster-assign"
          aria-pressed={assigned}
        >
          {assigned ? "Assigned" : "Assign"}
        </Button>
      </div>
    </li>
  );
}

export function AgentsRoster() {
  // Hired/assigned agent ids — local, in-memory parody state. A Set keeps
  // membership checks O(1); replaced (not mutated) so React re-renders.
  const [hired, setHired] = useState<ReadonlySet<string>>(new Set());
  const [assigned, setAssigned] = useState<ReadonlySet<string>>(new Set());

  // Toggle hire. Un-hiring also clears any assignment (you can't assign an agent
  // you no longer employ) — keeps the two flags consistent. The two setState
  // calls are kept SEPARATE (not nested inside one updater) so each updater stays
  // a pure function of its own previous state; `wasHired` is read from the
  // current render's `hired` to decide whether to also clear the assignment.
  function handleHire(id: string) {
    const wasHired = hired.has(id);
    setHired((prev) => {
      const next = new Set(prev);
      if (wasHired) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    // Un-hiring clears any assignment for the agent (a no-op same-reference when
    // it wasn't assigned, so React skips the update).
    if (wasHired) {
      setAssigned((prev) => {
        if (!prev.has(id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // Toggle assignment (only reachable when hired — the button is disabled
  // otherwise).
  function handleAssign(id: string) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section
      data-testid="agents-roster"
      aria-label="Rovo Agents"
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">Rovo Agents</h1>
          <p className="text-xs text-muted-foreground">
            {hired.size} of {ROSTER_AGENTS.length} agents hired. Each works 400%
            of the time, allegedly.
          </p>
        </div>
      </div>

      <ul className={cn("grid gap-3", "sm:grid-cols-2 xl:grid-cols-3")}>
        {ROSTER_AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            hired={hired.has(agent.id)}
            assigned={assigned.has(agent.id)}
            onHire={handleHire}
            onAssign={handleAssign}
          />
        ))}
      </ul>
    </section>
  );
}
