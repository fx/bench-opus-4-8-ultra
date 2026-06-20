// The "Rovo Agents" roster data (see docs/changes/0007 › Rovo Agents roster). A
// pure, deterministic list of absurd hireable parody agents with fake stats. No
// randomness, no clock — the roster renders identically every load and is
// trivially asserted.
//
// CONTRAST: each agent renders its `initials` as WHITE text on `avatarColor`, so
// every avatarColor MUST clear WCAG AA for white text (≥ 4.5:1). The colours
// below are AA-safe shades (mirrors of the seed's avatar palette) and are locked
// by roster-contrast.test.ts. The utilization badge paints a dark slate text on a
// light tint (NOT white-on-color) so it carries no white-on-color requirement;
// its contrast is provided by Tailwind theme tokens, not a hardcoded hex.

export interface RosterAgent {
  id: string;
  name: string;
  // One-line absurd specialty shown under the name.
  tagline: string;
  // Avatar initials, rendered WHITE on avatarColor (AA-guarded).
  initials: string;
  // Avatar background hex — white initials sit on it (AA-guarded).
  avatarColor: string;
  // Fabricated utilization percentage (0–100+) — part of the joke; some exceed
  // 100% because the agents are "over-allocated across realities".
  utilization: number;
  // Fabricated count of tickets this agent has "shipped".
  shipped: number;
}

// The hireable parody agents. Each is a recognisable Jira/SaaS anti-pattern
// personified. avatarColors are the seed's AA-safe palette so contrast holds.
export const ROSTER_AGENTS: RosterAgent[] = [
  {
    id: "standup-bot",
    name: "Standup Bot",
    tagline: "Attends every standup. Says “no blockers”. Has 14 blockers.",
    initials: "SB",
    avatarColor: "#0052CC", // blue 6.82:1
    utilization: 142,
    shipped: 0,
  },
  {
    id: "scope-creep-detector",
    name: "Scope Creep Detector",
    tagline: "Detects scope creep, then adds more scope to be thorough.",
    initials: "SC",
    avatarColor: "#0E7268", // teal 5.79:1
    utilization: 97,
    shipped: 311,
  },
  {
    id: "blame-assigner",
    name: "Blame Assigner",
    tagline: "Instantly identifies whose fault it is. (It's never Rovo.)",
    initials: "BA",
    avatarColor: "#C9372C", // red 5.16:1
    utilization: 88,
    shipped: 4,
  },
  {
    id: "velocity-inflator",
    name: "Velocity Inflator",
    tagline: "Multiplies story points by vibes. Burndown now points up.",
    initials: "VI",
    avatarColor: "#8044C7", // purple 5.88:1
    utilization: 400,
    shipped: 9001,
  },
  {
    id: "meeting-summarizer",
    name: "Meeting Summarizer",
    tagline: "Summarizes a 60-min meeting as “could've been an email”.",
    initials: "MS",
    avatarColor: "#9E5C00", // amber 5.27:1
    utilization: 61,
    shipped: 27,
  },
  {
    id: "test-deleter",
    name: "Test Deleter",
    tagline: "Keeps the checkmark green by removing the checkmark's enemies.",
    initials: "TD",
    avatarColor: "#6554C0", // violet 5.86:1
    utilization: 100,
    shipped: 0,
  },
];
