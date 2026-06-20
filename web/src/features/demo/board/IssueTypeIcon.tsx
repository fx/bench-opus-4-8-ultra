import { cn } from "../../../lib/cn.ts";
import type { IssueType } from "../data/types.ts";
import { TYPE_META } from "./issue-meta.ts";

// The coloured issue-type icon Jira shows on every card and in the issue key row
// (see docs/specs/demo-jira-clone › Kanban Board). The glyph sits white on a
// small rounded colour chip, matching real Jira. Metadata (glyph, colour, label)
// lives in issue-meta.ts so it can be shared with the issue detail (0006).

export interface IssueTypeIconProps {
  type: IssueType;
  className?: string;
}

export function IssueTypeIcon({ type, className }: IssueTypeIconProps) {
  const { Icon, color, label } = TYPE_META[type];
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-type={type}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <Icon className="h-3 w-3 text-white" />
    </span>
  );
}
