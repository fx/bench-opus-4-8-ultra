# 0005: Demo Kanban Board — columns, issue cards, drag-and-drop

## Summary

Implement the demo's primary view: a Jira-style Kanban board with four columns (To Do / In Progress / In Review / Done), richly-detailed draggable issue cards, live column counts, and status transitions on drop.

**Spec:** [Demo Jira Clone](../specs/demo-jira-clone/)
**Status:** complete
**Depends On:** 0004

## Motivation

The board is the centerpiece of the demo and the surface where the "Implement now with AI" parody (0007) lives. It must look and behave like a real Jira board: draggable cards, accurate meta, and live counts.

## Requirements

### Testing Requirements

This change MUST satisfy the project's standing testing rules (see [Architecture › Testing & Coverage](../specs/architecture/index.md#testing--coverage)). CI enforces these as merge gates:

- 100% TS/React coverage via `vitest run --coverage` (V8) across statements, branches, functions, lines.
- Vitest (+ React Testing Library) for components and board/store logic.
- Coverage thresholds MUST fail the run (and CI) below 100%.
- No `.only`; no unjustified `.skip`; any coverage exclusion MUST be explicitly listed with justification.
- ESLint + formatter MUST pass in CI.

Skipping or weakening any of these rules to land the PR MUST be treated as a bug in the PR, not in the rule.

### Board columns + counts

The board MUST render columns To Do / In Progress / In Review / Done, each with a name and live issue count derived from store state.

#### Scenario: Counts reflect state

- **GIVEN** the seeded board
- **WHEN** it renders
- **THEN** each column shows the correct count of its issues

### Cards with full meta

Cards MUST show summary, issue-type icon, key `SLOP-###`, priority icon, story-points badge, assignee avatar, and optional labels/epic lozenge, styled per Jira theme.

#### Scenario: Story card meta

- **GIVEN** Story `SLOP-101`
- **WHEN** rendered
- **THEN** it shows the green Story icon, key, priority chevron, points badge, and assignee avatar

### Drag-to-transition

Cards MUST be draggable between columns; a drop MUST update the issue status and both affected counts.

#### Scenario: Drag updates status + counts

- **GIVEN** a card in To Do
- **WHEN** dragged to In Progress
- **THEN** its status becomes In Progress and both column counts update

## Design

### Approach

- Under `web/src/features/demo/board/`: `Board`, `Column`, `Card`, plus issue-type/priority icon components and the points/assignee/lozenge sub-components.
- Drag-and-drop via `@dnd-kit/core`; on drop, dispatch a store `moveIssue(key, status)` action.
- Extend the 0004 store with `moveIssue` and column selectors; keep transition logic in the store (pure, unit-testable) separate from dnd wiring.
- Card exposes a slot/affordance for the later "Implement now with AI" action (0007) without implementing it here.

### Decisions

- **Decision:** `@dnd-kit/core` for DnD.
  - **Why:** modern, accessible, testable; good React fit.
  - **Alternatives:** `react-dnd` (heavier), HTML5 DnD (clunky) — rejected.
- **Decision:** Transition logic in the store, not the dnd handler.
  - **Why:** lets board logic be unit-tested without simulating drag events; dnd handler stays thin.

### Non-Goals

- No issue detail view (0006) — clicking a card is wired in 0006.
- No AI/agent actions on cards (0007).

## Tasks

- [x] Board + columns — `Board`, `Column` with live counts; store `moveIssue` + selectors; tests (counts, move logic)
- [x] Issue card — `Card` with full meta + issue-type/priority icons, points, avatar, lozenges; tests (meta rendering per type/priority)
- [x] Drag-and-drop — `@dnd-kit` wiring, drop → `moveIssue`, count updates; tests (drop handler updates status/counts)
- [x] Update `README.md` to note the working demo board

## Open Questions

- [x] Swimlanes (group-by) — include now or defer? **Deferred** — single lane per column for now (not trivial enough to include alongside the core board).
- [x] Accessibility of dnd (keyboard drag) — **included** the `@dnd-kit` `KeyboardSensor` so cards are draggable by keyboard (Space to pick up, arrows to move, Space to drop).

## References

- Spec: [Demo Jira Clone](../specs/demo-jira-clone/)
- Related: [0004-demo-app-shell](./0004-demo-app-shell.md)
- External: `@dnd-kit` (https://dndkit.com)
