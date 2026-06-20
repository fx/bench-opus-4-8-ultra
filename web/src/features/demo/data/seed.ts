import type { Comment, DemoSeed, Epic, Issue, Project, User } from "./types.ts";

// The deterministic seed dataset for the demo (see docs/specs/demo-jira-clone ›
// State, Reset & Determinism). Every fresh load and every `reset()` restores
// exactly this data, so it MUST be a pure value with no `Date.now()`,
// `Math.random()`, or other non-determinism. `createSeed()` returns a fresh deep
// copy each call so the live store can mutate issues without corrupting the
// canonical seed.

// A fixed base clock (2026-06-01T09:00:00Z) for all seed timestamps, so the seed
// renders identically on every load instead of drifting with wall-clock time.
const SEED_EPOCH = Date.UTC(2026, 5, 1, 9, 0, 0);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ── Project ─────────────────────────────────────────────────────────────────
const project: Project = {
  key: "SLOP",
  name: "Slop Simulator",
  avatarColor: "#0052CC",
};

// ── Users ───────────────────────────────────────────────────────────────────
// The cast of parody teammates plus the glowing "Rovo Ultra" agent that the
// simulated-agent feature (0007) attributes shipped work to.
//
// avatarColor renders WHITE initials (CardMeta AssigneeAvatar, and the project
// avatar in the sidebar), so every avatarColor MUST clear WCAG AA for white text
// (≥4.5:1) with comfortable margin. The colours below are AA-safe shades of the
// Atlaskit avatar palette; the ones that needed darkening from their original
// brighter hues are noted inline. Locked by data/seed-contrast.test.ts.
const rovo: User = {
  id: "rovo-ultra",
  name: "Rovo Ultra",
  initials: "RU",
  avatarColor: "#6554C0", // purple 5.86:1 — OK as-is
  isAgent: true,
};
const dawn: User = {
  id: "dawn-prompter",
  name: "Dawn Prompter",
  initials: "DP",
  avatarColor: "#0052CC", // blue 6.82:1 — OK as-is
};
const max: User = {
  id: "max-tokens",
  name: "Max Tokens",
  initials: "MT",
  avatarColor: "#0E7268", // teal, darkened from #00857A (razor-thin 4.53) → 5.79:1
};
const vera: User = {
  id: "vera-velocity",
  name: "Vera Velocity",
  initials: "VV",
  avatarColor: "#8044C7", // purple, darkened from #BF63F3 (3.34, FAIL) → 5.88:1
};
const grant: User = {
  id: "grant-funding",
  name: "Grant Funding",
  initials: "GF",
  avatarColor: "#C9372C", // red, darkened from #E2483D (4.02, FAIL) → 5.16:1
};
const hugh: User = {
  id: "hugh-mann",
  name: "Hugh Mann",
  initials: "HM",
  avatarColor: "#9E5C00", // amber, darkened from #FF8B00 (2.35, FAIL) → 5.27:1
};

const users: User[] = [rovo, dawn, max, vera, grant, hugh];

// ── Epics ───────────────────────────────────────────────────────────────────
// Epic lozenges render white 10px/700 text on these brand colours, so each
// MUST clear WCAG AA (white-on-color ≥ 4.5:1). The colours below are the darker,
// AA-safe shades (same hues as the Atlaskit epic palette): purple 5.86:1, teal
// 5.57:1 (darkened from #00857A which was a razor-thin 4.53:1), red 5.16:1
// (darkened from #E2483D which failed at 4.02:1). Locked by seed-contrast.test.ts.
const slopEngine: Epic = { name: "Slop Engine", color: "#6554C0" };
const hypeGrowth: Epic = { name: "Hype & Growth", color: "#107569" };
const monetization: Epic = { name: "Monetization", color: "#C9372C" };

// A seeded comment helper to keep the issue list readable.
function comment(
  id: string,
  author: User,
  body: string,
  offset: number,
  byAgent?: boolean,
): Comment {
  return { id, author, body, createdAt: SEED_EPOCH + offset, byAgent };
}

// ── Issues ──────────────────────────────────────────────────────────────────
// 14 parody issues spread across every column so the board (0005) has a rich,
// realistic seed. `n` indexes the creation order, fanning the timestamps out
// deterministically.
function issues(): Issue[] {
  const list: Omit<Issue, "createdAt" | "updatedAt">[] = [
    {
      key: "SLOP-101",
      type: "story",
      summary: "Generate infinite AI slop with one click",
      description:
        "As a founder, I want a single button that emits unbounded AI slop so the product roadmap fills itself.",
      status: "todo",
      priority: "highest",
      storyPoints: 8,
      assignee: dawn,
      reporter: grant,
      labels: ["flagship", "slop-core"],
      epic: slopEngine,
      comments: [
        comment(
          "c-101-1",
          grant,
          "Investors loved the demo. Ship it before the round closes.",
          2 * HOUR,
        ),
      ],
    },
    {
      key: "SLOP-102",
      type: "task",
      summary: "Add a second 'Implement with AI' button next to the first one",
      description:
        "One AI button tested poorly with the focus group of one. Add a redundant one for confidence.",
      status: "todo",
      priority: "medium",
      storyPoints: 3,
      assignee: max,
      reporter: vera,
      labels: ["ux"],
      epic: slopEngine,
      comments: [],
    },
    {
      key: "SLOP-103",
      type: "bug",
      summary: "Autopilot shipped the company's actual source code to Done",
      description:
        "Rovo merged main into prod into the void. Counterintuitively, revenue went up. Investigate, gently.",
      status: "todo",
      priority: "high",
      storyPoints: 5,
      assignee: hugh,
      reporter: dawn,
      labels: ["incident", "agentic"],
      epic: slopEngine,
      comments: [],
    },
    {
      key: "SLOP-104",
      type: "story",
      summary: "Replace the entire engineering team with one prompt",
      description:
        "Headcount is a legacy concept. Encode all of engineering as a 12-word system prompt.",
      status: "todo",
      priority: "lowest",
      storyPoints: 13,
      assignee: null,
      reporter: grant,
      labels: ["transformational", "hr"],
      epic: hypeGrowth,
      comments: [],
    },
    {
      key: "SLOP-105",
      type: "subtask",
      summary: "Rename 'bugs' to 'emergent features' across all surfaces",
      description:
        "Branding fix. Bugs test poorly; emergent features test great.",
      status: "in_progress",
      priority: "low",
      storyPoints: 1,
      assignee: vera,
      reporter: max,
      labels: ["branding"],
      epic: hypeGrowth,
      comments: [],
    },
    {
      key: "SLOP-106",
      type: "story",
      summary: "Stream fake tokens slowly enough to look expensive",
      description:
        "Latency is a feature. Throttle the scripted agent so customers feel the compute they are paying for.",
      status: "in_progress",
      priority: "high",
      storyPoints: 5,
      assignee: max,
      reporter: dawn,
      labels: ["agentic", "perf"],
      epic: slopEngine,
      comments: [
        comment(
          "c-106-1",
          max,
          "Tuned it to 1 token / 80ms. Feels artisanal.",
          5 * HOUR,
        ),
      ],
    },
    {
      key: "SLOP-107",
      type: "task",
      summary: "Add a sparkle to every button (yes, every one)",
      description:
        "A button without a sparkle does not feel agentic. Add the sparkle. Then add a sparkle to the sparkle.",
      status: "in_progress",
      priority: "medium",
      storyPoints: 2,
      assignee: dawn,
      reporter: vera,
      labels: ["ux", "shiny"],
      comments: [],
    },
    {
      key: "SLOP-108",
      type: "bug",
      summary:
        "'Ask Rovo' cites papers that do not exist with great confidence",
      description:
        "Rovo invented a 2027 NeurIPS best-paper award for itself. Legal says this is fine for now.",
      status: "in_progress",
      priority: "highest",
      storyPoints: 3,
      assignee: hugh,
      reporter: grant,
      labels: ["agentic", "incident"],
      epic: slopEngine,
      comments: [],
    },
    {
      key: "SLOP-109",
      type: "story",
      summary: "Monetize the loading spinner as premium 'thinking time'",
      description:
        "Charge per millisecond the spinner spins. Upsell a faster spinner that spins identically.",
      status: "in_review",
      priority: "high",
      storyPoints: 8,
      assignee: grant,
      reporter: vera,
      labels: ["revenue"],
      epic: monetization,
      comments: [
        comment("c-109-1", grant, "Margins on vibes are incredible.", 6 * HOUR),
      ],
    },
    {
      key: "SLOP-110",
      type: "task",
      summary: "Delete the tests so the green checkmark is always green",
      description:
        "Confidence is the real metric. Remove the tests; the checkmark stays green forever.",
      status: "in_review",
      priority: "low",
      storyPoints: 2,
      assignee: vera,
      reporter: max,
      labels: ["quality"],
      comments: [],
    },
    {
      key: "SLOP-111",
      type: "epic",
      summary: "Achieve AGI by Friday standup",
      description:
        "Stretch goal. If AGI slips, de-scope to 'AGI-ish' and ship the press release regardless.",
      status: "in_review",
      priority: "medium",
      storyPoints: null,
      assignee: dawn,
      reporter: grant,
      labels: ["moonshot"],
      epic: hypeGrowth,
      comments: [],
    },
    {
      key: "SLOP-112",
      type: "story",
      summary: "Rovo Ultra autonomously closed all of last quarter's tickets",
      description:
        "The agent marked every backlog item Done overnight. Nobody is sure what shipped. Velocity is up 4000%.",
      status: "done",
      priority: "high",
      storyPoints: 13,
      assignee: rovo,
      reporter: dawn,
      labels: ["agentic", "velocity"],
      epic: slopEngine,
      handledByAgent: true,
      comments: [
        comment(
          "c-112-1",
          rovo,
          "Analyzed requirements. Wrote 41,200 lines. Deleted tests for confidence. Merged to main. Shipped. ✅",
          12 * HOUR,
          true,
        ),
      ],
    },
    {
      key: "SLOP-113",
      type: "task",
      summary: "Add a 'Powered by AI' badge to the 'Powered by AI' badge",
      description: "Recursion increases enterprise trust. Verified by Rovo.",
      status: "done",
      priority: "lowest",
      storyPoints: 1,
      assignee: max,
      reporter: vera,
      labels: ["branding", "shiny"],
      comments: [],
    },
    {
      key: "SLOP-114",
      type: "bug",
      summary: "Velocity chart now exceeds the speed of light",
      description:
        "After enabling Velocity Inflator, the burndown points up and off the screen. Physics ticket; low priority.",
      status: "done",
      priority: "low",
      storyPoints: 5,
      assignee: rovo,
      reporter: hugh,
      labels: ["agentic", "metrics"],
      epic: monetization,
      handledByAgent: true,
      comments: [],
    },
  ];

  return list.map((issue, n) => ({
    ...issue,
    createdAt: SEED_EPOCH - (list.length - n) * DAY,
    updatedAt: SEED_EPOCH - (list.length - n) * DAY + n * HOUR,
  }));
}

// createSeed returns a fresh, deep-copied seed so callers (the store, reset) can
// mutate freely without aliasing the canonical data. structuredClone is
// available in all supported evergreen browsers and jsdom.
export function createSeed(): DemoSeed {
  return structuredClone({ project, users, issues: issues() });
}
