# Demo Jira Clone

## Overview

The Demo is an in-browser, client-side parody of Atlassian Jira Cloud served at `/demo`. It MUST look convincingly like real Jira (Atlaskit-derived light theme, top nav + left sidebar + dense board, issue cards, issue detail view), but every notable feature MUST be an exaggerated "agentic AI" gag. Tickets MUST display flashy "Implement now with AI" buttons; activating one MUST spawn a simulated AI agent that visibly "implements" the feature with realistic, streaming output and real timing. All data is mocked in the browser; there is no real backend. Despite being fake, every interaction MUST feel real.

## Background

The demo parodies Atlassian's real AI ("Atlassian Intelligence" / "Rovo") by taking the genuine "assign work to an AI agent like a teammate" concept and amplifying it to absurdity. It uses the Jira (light) theme from the [Design System](../design-system/). The demo is reached from the [Landing Page](../landing-page/) "Demo" CTA and via deep links under `/demo` (handled by SPA fallback per [Architecture](../architecture/)).

All "agent" behavior is a deterministic, scripted client-side simulation — no LLM, no network. The simulation MUST nonetheless produce the *feel* of a live agent: token-by-token streaming, step transitions, plausible delays, and a final "success".

## Requirements

### App Chrome (Jira look-alike)

- The demo MUST render a three-zone layout: a fixed top navigation bar, a collapsible left sidebar, and a main content area.
- The top nav MUST contain (left→right): an app-switcher (9-dot) icon, the product wordmark ("SLOP" / "Slop Jira"), primary nav items (Your work, Projects, Filters, Dashboards), a prominent blue **Create** button, a search/command input, and a right cluster (notifications bell with badge, help, settings, profile avatar) plus an AI/"Rovo" entry point.
- The left sidebar MUST show the current project ("Slop Simulator" project, key `SLOP`) and a view list: Summary, Timeline, Backlog, **Board** (default/active), Calendar, Reports, Issues, plus a parody "Rovo Agents" item. The sidebar MUST be collapsible.
- Colors, spacing, fonts, lozenges, and elevations MUST follow the Jira theme tokens in the [Design System](../design-system/) (primary `#0052CC`, text `#172B4D`, page bg `#F4F5F7`, Inter font).

#### Scenario: Demo chrome looks like Jira

- **GIVEN** the user navigates to `/demo`
- **WHEN** the app loads
- **THEN** the top nav, collapsible left sidebar, and board content area render with Atlaskit-derived styling and the `SLOP` project context

#### Scenario: Sidebar collapses

- **GIVEN** the demo with the sidebar expanded
- **WHEN** the user toggles the collapse control
- **THEN** the sidebar folds to an icon rail and the board reflows to use the space

### Kanban Board

- The Board MUST be the default demo view, with columns **To Do · In Progress · In Review · Done**.
- Each column header MUST show its name and a live issue count.
- Cards MUST display: summary text, an issue-type icon (Story/Task/Bug/Epic/Sub-task with the conventional colors), the issue key (`SLOP-###`), a priority icon (chevrons), a story-points badge, and an assignee avatar; optional labels and epic lozenge.
- Cards MUST be draggable between columns; dropping a card MUST update its status and the column counts.
- The board MUST be seeded with a rich set of parody issues (at least ~12) whose titles are exaggerated AI/slop features.

#### Scenario: Drag updates status and counts

- **GIVEN** a card in "To Do"
- **WHEN** the user drags it to "In Progress"
- **THEN** the card moves, its status becomes In Progress, and both column counts update

#### Scenario: Card shows full meta

- **GIVEN** the board
- **WHEN** it renders a Story card `SLOP-101`
- **THEN** the card shows the green Story icon, key `SLOP-101`, a priority chevron, a points badge, and an assignee avatar

### Issue Detail View

- Clicking a card MUST open an issue detail view (modal/slide-over) with a two-column layout: a left content column (summary, status dropdown, description, comments/activity feed) and a right Details panel (assignee, reporter, priority, labels, story points, sprint, epic, created/updated).
- The status dropdown MUST allow transitioning the issue; transitions MUST reflect on the board.
- The activity feed MUST support adding comments (mock), shown in reverse-chronological order with avatar and timestamp.

#### Scenario: Open and transition an issue

- **GIVEN** the board
- **WHEN** the user clicks card `SLOP-101` and changes its status to "Done" in the detail view
- **THEN** the detail view and the board both reflect the issue in Done

### "Implement now with AI" — Simulated Agent (core parody)

- Every board card MUST surface a flashy **"✨ Implement now with AI"** action (e.g. on hover and in the issue detail view).
- Activating it MUST open an agent panel that simulates an AI agent implementing the feature with **realistic streaming**: a sequence of steps, each with token-by-token (or chunked) streaming text, plausible per-step delays, and visible progress.
- The simulation MUST be deterministic and scripted (no real LLM/network) yet feel live: a cursor/caret while streaming, step status transitions (running → done), and a terminal-style log of absurd actions (e.g. "Analyzing requirements…", "Writing 4,200 lines…", "Deleting tests for confidence…", "Merging to main ✅").
- On completion the agent MUST "ship" the issue: the card MUST animate through columns to **Done**, be marked as handled by an agent (e.g. a glowing "Rovo Ultra" avatar / "🤖 Rovo handled this" lozenge), and the activity feed MUST record the agent's actions.
- The user MUST be able to cancel an in-progress agent run; cancelling MUST stop the stream and leave the issue in a sane state (not Done).

#### Scenario: Agent implements a ticket end-to-end

- **GIVEN** an issue in To Do
- **WHEN** the user clicks "Implement now with AI" and lets the run complete
- **THEN** the panel streams scripted steps with realistic timing, the issue ends in Done marked as agent-handled, and the activity feed logs the run

#### Scenario: Streaming feels live

- **GIVEN** an agent run in progress
- **WHEN** a step is streaming
- **THEN** text appears incrementally over time (not all at once) with a visible caret, and steps transition from running to done in sequence

#### Scenario: Cancel mid-run

- **GIVEN** an agent run in progress on a To Do issue
- **WHEN** the user cancels
- **THEN** streaming stops promptly and the issue is NOT marked Done

### Additional Parody AI Features

The demo MUST include several additional exaggerated AI placements that look real, including at minimum:

- **Agentic Autopilot toggle** on the board top bar ("Let Rovo run the sprint"): when ON, cards MUST autonomously move/“ship” over time without user action; turning it OFF MUST stop the autonomy.
- **Ask Rovo command bar** in the top nav: typing a query MUST return an over-confident, absurd, citation-laden scripted answer.
- **AI-generate summary/description** sparkle buttons in the issue detail that fill fields with bloated buzzword-dense text.
- **Rovo Agents roster** page (sidebar item) listing absurd hireable agents (e.g. "Standup Bot", "Scope Creep Detector", "Blame Assigner", "Velocity Inflator") with fake utilization stats and Hire/Assign buttons.
- **AI status transition** ("→ Done (by AI)") and/or agent comments recorded in the activity feed.

#### Scenario: Autopilot ships tickets on its own

- **GIVEN** the board with Autopilot OFF
- **WHEN** the user toggles Autopilot ON and waits
- **THEN** cards begin moving toward Done automatically, and toggling OFF halts further automatic movement

#### Scenario: Ask Rovo returns absurd confident answer

- **GIVEN** the Rovo command bar
- **WHEN** the user submits any query
- **THEN** a scripted, over-confident, citation-laden parody answer is shown

### State, Reset & Determinism

- All demo state (issues, statuses, agent runs, autopilot, comments) MUST live in client memory (e.g. a store/context); no server persistence is required.
- The demo MUST start from a deterministic seeded dataset on each fresh load, and SHOULD offer a "Reset demo" affordance to restore the seed.
- The agent simulation timing MUST be driven through an injectable timer/clock abstraction so it can be tested deterministically (fast-forwarded) without real waits.

#### Scenario: Reset restores seed

- **GIVEN** a demo where the user moved cards and ran agents
- **WHEN** the user resets the demo
- **THEN** the board returns to the seeded initial state

## Design

### Architecture

- Lives under `web/src/features/demo/`. The route container applies `data-theme="jira"` (see [Design System › Theme Scoping](../design-system/index.md#theme-scoping)).
- Structure: `chrome/` (TopNav, Sidebar, AppShell), `board/` (Board, Column, Card, dnd), `issue/` (IssueDetail, ActivityFeed, DetailsPanel, StatusDropdown), `agent/` (AgentPanel, agent simulation engine), `rovo/` (CommandBar, AgentsRoster, Autopilot), `data/` (seed dataset, types), `store/` (state).
- State managed with a lightweight store (Zustand or React context + reducer); the choice is finalized in change 0004.

### Data Models

```ts
type IssueType = "story" | "task" | "bug" | "epic" | "subtask";
type Priority = "highest" | "high" | "medium" | "low" | "lowest";
type Status = "todo" | "in_progress" | "in_review" | "done";

type User = { id: string; name: string; initials: string; avatarColor: string; isAgent?: boolean };

type Issue = {
  key: string;            // "SLOP-101"
  type: IssueType;
  summary: string;
  description: string;
  status: Status;
  priority: Priority;
  storyPoints: number | null;
  assignee: User | null;
  reporter: User;
  labels: string[];
  epic?: { name: string; color: string };
  comments: Comment[];
  handledByAgent?: boolean;
  createdAt: number;
  updatedAt: number;
};

type Comment = { id: string; author: User; body: string; createdAt: number; byAgent?: boolean };

type AgentStep = { id: string; label: string; output: string; durationMs: number };
type AgentRun = { issueKey: string; steps: AgentStep[]; status: "idle" | "running" | "done" | "cancelled"; currentStep: number };
```

### Agent Simulation Engine

- A pure, deterministic engine produces an ordered list of `AgentStep`s for a given issue (script may vary flavor by issue type) and drives streaming via an injectable clock.
- Streaming MUST reveal each step's `output` incrementally (chunked over `durationMs`) and emit progress events the `AgentPanel` renders.
- The engine MUST expose start, tick/advance, and cancel; the timer abstraction MUST allow tests to fast-forward deterministically (fake timers).
- On completion the engine MUST emit a terminal event that the store consumes to mark the issue Done + agent-handled and append activity entries.

### Parody Injection Points (real UI location → absurd feature)

Per the Jira research: card hover "Implement now with AI"; agent-handled "🤖 Rovo handled this" lozenge with "Rovo Ultra" avatar; top-nav "Ask Rovo Anything" command bar; right-panel streaming agent feed in issue detail; AI-generate summary/description; board "Agentic Autopilot" toggle; "→ Done (by AI)" status transition; sidebar "Rovo Agents" roster; "✨ Reply with AI" in the comment composer; "describe it and let Rovo build the ticket" in Create.

### UI Components

Built from Design-System shadcn primitives restyled for Jira: `Dialog`/sheet for issue detail and agent panel, `DropdownMenu` for status, `Avatar`, `Badge`/lozenge, `Switch` for Autopilot, `Input`/command for Ask Rovo, `Tooltip`, `ScrollArea`. Drag-and-drop via a small dnd library (e.g. `@dnd-kit/core`), finalized in change 0005.

### Business Logic

- Board: status transitions, column membership, counts.
- Agent runs: scripted streaming, completion side-effects, cancellation.
- Autopilot: timed autonomous transitions, start/stop.
- Ask Rovo: query → scripted response selection.
- Reset: restore seed.

## Constraints

- Entirely client-side; no real backend, no network calls, no real LLM.
- MUST feel real: realistic streaming/timing, draggable board, working transitions.
- Timing MUST be injectable for deterministic tests; agent/autopilot timers MUST be fast-forwardable.
- 100% test coverage (see [Architecture › Testing](../architecture/index.md#testing--coverage)): store reducers, the agent engine (including cancellation and completion), autopilot start/stop, Ask Rovo selection, drag-to-transition logic, and reset MUST all be covered, using fake timers rather than real waits.
- MUST honor `prefers-reduced-motion` for card/agent animations.

## Open Questions

- **State library** — Zustand vs. context+reducer. Default: Zustand (ergonomic, testable). Finalized in change 0004.
- **Drag-and-drop library** — `@dnd-kit/core` vs. `react-dnd`. Default: `@dnd-kit/core` (modern, accessible, testable). Finalized in change 0005.
- **Streaming granularity** — per-character vs. per-token/word chunks. Default: word/chunk-based for performance and realistic feel; configurable by the engine.
- **Autopilot pacing** — fixed interval vs. randomized jitter. Default: jittered interval driven by the injectable clock (seeded for determinism in tests).

## References

- [Design System](../design-system/) — Jira theme tokens, lozenges, primitives
- [Architecture](../architecture/) — routing, SPA fallback, testing
- [Landing Page](../landing-page/) — entry point (Demo CTA)
- Atlassian Design System — https://atlassian.design/foundations/color
- Atlassian Rovo (real AI being parodied) — https://www.atlassian.com/software/jira/ai
- `@dnd-kit` — https://dndkit.com

## Changelog

| Date | Change | Document |
|------|--------|----------|
| 2026-06-20 | Initial spec created | — |
| 2026-06-20 | Demo app shell & routing defined | [0004-demo-app-shell](../../changes/0004-demo-app-shell.md) |
| 2026-06-20 | Demo Kanban board defined | [0005-demo-board](../../changes/0005-demo-board.md) |
| 2026-06-20 | Demo issue detail view defined | [0006-demo-issue-detail](../../changes/0006-demo-issue-detail.md) |
| 2026-06-20 | Demo agentic AI parody features defined | [0007-demo-agent-features](../../changes/0007-demo-agent-features.md) |
