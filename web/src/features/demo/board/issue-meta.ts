import type { ComponentType } from "react";
import {
  Bookmark,
  Bug,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Equal,
  Layers,
  SquareCheck,
  Zap,
} from "lucide-react";
import type { IssueType, Priority } from "../data/types.ts";

// Presentation metadata for issue cards (icons + brand colours + labels), kept
// in a plain module — separate from the icon components — so the label helpers
// and the metadata maps can be exported without tripping the React Fast-Refresh
// "only export components" rule, and so the issue detail (0006) can reuse them.

type IconType = ComponentType<{ className?: string }>;

export interface TypeMeta {
  Icon: IconType;
  // Background colour of the issue-type chip (Atlaskit issue-type palette).
  color: string;
  // Accessible label, e.g. "Story".
  label: string;
}

// Keyed by IssueType so the union is exhaustively covered; adding a type without
// an entry fails to compile. Story=green bookmark, Task=blue check, Bug=red bug,
// Epic=purple bolt, Sub-task=teal layers — the conventional Jira glyphs.
export const TYPE_META: Record<IssueType, TypeMeta> = {
  story: { Icon: Bookmark, color: "#65BA43", label: "Story" },
  task: { Icon: SquareCheck, color: "#4BADE8", label: "Task" },
  bug: { Icon: Bug, color: "#E5493A", label: "Bug" },
  epic: { Icon: Zap, color: "#904EE2", label: "Epic" },
  subtask: { Icon: Layers, color: "#4BADE8", label: "Sub-task" },
};

// Human-readable label for an issue type — shared across card/detail surfaces.
export function issueTypeLabel(type: IssueType): string {
  return TYPE_META[type].label;
}

export interface PriorityMeta {
  Icon: IconType;
  color: string;
  label: string;
}

// Keyed by Priority so the union is exhaustively covered. High priorities point
// up in warm reds/oranges; low priorities point down in blues; medium is a
// neutral amber equals bar — matching the Atlaskit priority icon set.
export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  highest: { Icon: ChevronsUp, color: "#CD1316", label: "Highest" },
  high: { Icon: ChevronUp, color: "#E5493A", label: "High" },
  medium: { Icon: Equal, color: "#E97F33", label: "Medium" },
  low: { Icon: ChevronDown, color: "#2D8738", label: "Low" },
  lowest: { Icon: ChevronsDown, color: "#0065FF", label: "Lowest" },
};

// Human-readable label for a priority — shared across card/detail surfaces.
export function priorityLabel(priority: Priority): string {
  return PRIORITY_META[priority].label;
}
