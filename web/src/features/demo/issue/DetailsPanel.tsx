import type { ReactNode } from "react";
import type { Issue } from "../data/types.ts";
import {
  AssigneeAvatar,
  EpicLozenge,
  LabelLozenge,
} from "../board/CardMeta.tsx";
import { PriorityIcon } from "../board/PriorityIcon.tsx";
import { priorityLabel } from "../board/issue-meta.ts";
import { formatAbsoluteDate, formatRelativeTime } from "./relative-time.ts";

// The issue-detail right-hand Details panel (see docs/changes/0006 › layout). A
// Jira-style labelled field list: assignee, reporter, priority, labels, story
// points, sprint, epic, plus created/updated stamps. Optional/null fields render
// an explicit placeholder ("Unassigned", "None") so the panel never silently
// drops a row — every field is always present, matching real Jira.
//
// The demo has no sprint model, so sprint shows a fixed parody value (the board's
// running sprint); everything else is data-driven from the issue.

// A static parody sprint — the demo seeds no sprint field, but Jira's panel always
// shows one, so we render the project's "current" sprint for verisimilitude.
const CURRENT_SPRINT = "SLOP Sprint 7";

interface FieldProps {
  label: string;
  children: ReactNode;
}

// One labelled row in the panel: a muted field label above its value.
function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export interface DetailsPanelProps {
  issue: Issue;
  // Current time (epoch ms) for the "updated x ago" stamp; injected for
  // deterministic tests, Date.now() live.
  now: number;
}

export function DetailsPanel({ issue, now }: DetailsPanelProps) {
  return (
    <aside
      aria-label="Details"
      data-testid="details-panel"
      className="rounded-md border border-border bg-card p-4"
    >
      <h3 className="mb-3 text-sm font-semibold text-foreground">Details</h3>
      <dl className="flex flex-col gap-4">
        <Field label="Assignee">
          <span className="inline-flex items-center gap-2">
            <AssigneeAvatar user={issue.assignee} />
            <span>{issue.assignee ? issue.assignee.name : "Unassigned"}</span>
          </span>
        </Field>

        <Field label="Reporter">
          <span className="inline-flex items-center gap-2">
            <AssigneeAvatar user={issue.reporter} />
            <span>{issue.reporter.name}</span>
          </span>
        </Field>

        <Field label="Priority">
          <span className="inline-flex items-center gap-1.5">
            <PriorityIcon priority={issue.priority} />
            <span>{priorityLabel(issue.priority)}</span>
          </span>
        </Field>

        <Field label="Labels">
          {issue.labels.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {issue.labels.map((label) => (
                <LabelLozenge key={label} label={label} />
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </Field>

        <Field label="Story points">
          {issue.storyPoints === null ? (
            <span className="text-muted-foreground">None</span>
          ) : (
            <span>{issue.storyPoints}</span>
          )}
        </Field>

        <Field label="Sprint">
          <span>{CURRENT_SPRINT}</span>
        </Field>

        <Field label="Epic">
          {issue.epic ? (
            <span className="flex">
              <EpicLozenge epic={issue.epic} />
            </span>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </Field>

        <Field label="Created">
          <time dateTime={new Date(issue.createdAt).toISOString()}>
            {formatAbsoluteDate(issue.createdAt)}
          </time>
        </Field>

        <Field label="Updated">
          <time dateTime={new Date(issue.updatedAt).toISOString()}>
            {formatRelativeTime(issue.updatedAt, now)}
          </time>
        </Field>
      </dl>
    </aside>
  );
}
