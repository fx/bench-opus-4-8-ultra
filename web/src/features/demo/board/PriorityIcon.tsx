import { cn } from "../../../lib/cn.ts";
import type { Priority } from "../data/types.ts";
import { PRIORITY_META } from "./issue-meta.ts";

// The priority chevron Jira renders on every card (see docs/specs/demo-jira-clone
// › Kanban Board). Metadata (glyph, colour, label) lives in issue-meta.ts so it
// can be shared with the issue detail (0006).

export interface PriorityIconProps {
  priority: Priority;
  className?: string;
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  const { Icon, color, label } = PRIORITY_META[priority];
  // The lucide icon is wrapped in a labelled span (rather than spreading aria/
  // role onto the icon) so the accessible name is stable regardless of the
  // icon's own prop surface, mirroring IssueTypeIcon.
  return (
    <span
      role="img"
      aria-label={`${label} priority`}
      title={`${label} priority`}
      data-priority={priority}
      className={cn("inline-flex h-4 w-4 shrink-0 items-center", className)}
      style={{ color }}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
