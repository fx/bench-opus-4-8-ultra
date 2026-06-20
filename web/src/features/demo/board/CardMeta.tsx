import { Avatar, AvatarFallback } from "../../../components/ui/avatar.tsx";
import { cn } from "../../../lib/cn.ts";
import type { Epic, User } from "../data/types.ts";

// Small, self-contained card meta sub-components shared by the board Card (and
// reusable by the issue detail in 0006). Each is intentionally tiny and styled
// to the Jira theme so the card stays dense and scannable like real Jira.

// StoryPoints — the round grey points badge on the card footer. Hidden by the
// caller when an issue has no estimate (storyPoints === null); this component
// only renders a concrete number.
export interface StoryPointsProps {
  points: number;
  className?: string;
}

export function StoryPoints({ points, className }: StoryPointsProps) {
  return (
    <span
      data-testid="story-points"
      aria-label={`${points} story points`}
      title={`${points} story points`}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-panel px-1.5 text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      {points}
    </span>
  );
}

// AssigneeAvatar — the assignee's coloured initials avatar. The agent ("Rovo
// Ultra") gets a violet ring so agent-handled work reads as AI at a glance
// (foreshadowing the 0007 glowing-avatar treatment). Unassigned issues render a
// dashed placeholder so the slot never collapses.
export interface AssigneeAvatarProps {
  user: User | null;
  className?: string;
}

export function AssigneeAvatar({ user, className }: AssigneeAvatarProps) {
  if (!user) {
    return (
      <span
        role="img"
        aria-label="Unassigned"
        title="Unassigned"
        className={cn(
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/60 text-[10px] text-muted-foreground",
          className,
        )}
      >
        ?
      </span>
    );
  }

  return (
    <Avatar
      aria-label={`Assignee: ${user.name}`}
      title={user.name}
      className={cn(
        "h-6 w-6 text-white",
        user.isAgent && "ring-2 ring-[#6554C0] ring-offset-1",
        className,
      )}
    >
      <AvatarFallback
        className="text-[10px] font-semibold text-white"
        style={{ backgroundColor: user.avatarColor }}
      >
        {user.initials}
      </AvatarFallback>
    </Avatar>
  );
}

// LabelLozenge — a flat grey Jira label chip (e.g. "agentic", "flagship").
export interface LabelLozengeProps {
  label: string;
  className?: string;
}

export function LabelLozenge({ label, className }: LabelLozengeProps) {
  return (
    <span
      data-testid="label-lozenge"
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-sm bg-panel px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}

// EpicLozenge — the coloured epic chip Jira shows above an issue's summary. The
// chip text is white on the epic's brand colour.
export interface EpicLozengeProps {
  epic: Epic;
  className?: string;
}

export function EpicLozenge({ epic, className }: EpicLozengeProps) {
  return (
    <span
      data-testid="epic-lozenge"
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
        className,
      )}
      style={{ backgroundColor: epic.color }}
    >
      {epic.name}
    </span>
  );
}
