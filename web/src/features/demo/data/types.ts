// Demo data model for the Jira-parody app (see docs/specs/demo-jira-clone).
// These types are the stable contract the board (0005), issue detail (0006), and
// agent (0007) changes build on; the shell change (0004) lands them ahead of the
// board so later work consumes a tested data layer. All data is mocked in the
// browser — there is no backend.

// Issue type drives the card's coloured type icon (Story/Task/Bug/Epic/Sub-task).
export type IssueType = "story" | "task" | "bug" | "epic" | "subtask";

// Priority drives the chevron icon on cards; ordered highest → lowest.
export type Priority = "highest" | "high" | "medium" | "low" | "lowest";

// Status is also the Kanban column membership: To Do · In Progress · In Review ·
// Done (see the board spec).
export type Status = "todo" | "in_progress" | "in_review" | "done";

// A person (or agent) who can author/own work. `isAgent` marks the parody "Rovo
// Ultra" AI teammate so the UI can render its glowing avatar / lozenge.
export interface User {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  isAgent?: boolean;
}

// A comment / activity-feed entry. `byAgent` flags entries the simulated agent
// records when it "ships" an issue (0007).
export interface Comment {
  id: string;
  author: User;
  body: string;
  createdAt: number;
  byAgent?: boolean;
}

// An epic grouping shown as a lozenge on cards.
export interface Epic {
  name: string;
  color: string;
}

// A board issue. `handledByAgent` flips when the simulated agent ships it.
// `createdAt`/`updatedAt` are epoch millis from a fixed seed clock so the seed is
// deterministic (no `Date.now()` at module load).
export interface Issue {
  key: string; // "SLOP-101"
  type: IssueType;
  summary: string;
  description: string;
  status: Status;
  priority: Priority;
  storyPoints: number | null;
  assignee: User | null;
  reporter: User;
  labels: string[];
  epic?: Epic;
  comments: Comment[];
  handledByAgent?: boolean;
  createdAt: number;
  updatedAt: number;
}

// A single scripted step the simulated agent (0007) streams while "implementing"
// an issue. `output` is the absurd text revealed incrementally over `durationMs`;
// `label` is the terminal-style heading (e.g. "Analyzing requirements"). Defined
// here beside the other demo models since the agent script, engine, and panel all
// consume it. See docs/specs/demo-jira-clone › Agent Simulation Engine.
export interface AgentStep {
  id: string;
  label: string;
  output: string;
  durationMs: number;
}

// The project context shown in the sidebar header.
export interface Project {
  key: string; // "SLOP"
  name: string; // "Slop Simulator"
  avatarColor: string;
}

// The seeded dataset the store initialises from and `reset()` restores to.
export interface DemoSeed {
  project: Project;
  users: User[];
  issues: Issue[];
}

// The four board columns in display order. Kept beside the Status type so the
// board (0005) and any status-aware UI share one ordering source.
export const STATUS_ORDER: readonly Status[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const;

// Human-readable column titles keyed by Status.
export const STATUS_LABELS: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};
