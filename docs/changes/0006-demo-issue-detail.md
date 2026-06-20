# 0006: Demo Issue Detail — two-column issue view, status transitions, activity

## Summary

Implement the issue detail view opened from a board card: a two-column Jira-style layout (left content: summary, status dropdown, description, activity/comments; right Details panel) with status transitions that reflect on the board and a working (mock) comment composer.

**Spec:** [Demo Jira Clone](../specs/demo-jira-clone/)
**Status:** draft
**Depends On:** 0005

## Motivation

Issue detail is where users inspect a ticket and where the right-hand streaming agent panel (0007) and AI-generate-field buttons live. It must convincingly mirror Jira's issue view and keep board state in sync.

## Requirements

### Testing Requirements

This change MUST satisfy the project's standing testing rules (see [Architecture › Testing & Coverage](../specs/architecture/index.md#testing--coverage)). CI enforces these as merge gates:

- 100% TS/React coverage via `vitest run --coverage` (V8) across statements, branches, functions, lines.
- Vitest (+ React Testing Library) for components and store logic.
- Coverage thresholds MUST fail the run (and CI) below 100%.
- No `.only`; no unjustified `.skip`; any coverage exclusion MUST be explicitly listed with justification.
- ESLint + formatter MUST pass in CI.

Skipping or weakening any of these rules to land the PR MUST be treated as a bug in the PR, not in the rule.

### Issue detail layout

Clicking a card MUST open a detail view (modal/slide-over) with a left content column (summary, status dropdown, description, activity feed) and a right Details panel (assignee, reporter, priority, labels, story points, sprint, epic, created/updated).

#### Scenario: Open detail from card

- **GIVEN** the board
- **WHEN** card `SLOP-101` is clicked
- **THEN** the detail view opens showing that issue's content and details

### Status transition syncs board

Changing status in the detail view MUST update the store so the board reflects the new column.

#### Scenario: Transition reflects on board

- **GIVEN** `SLOP-101` open
- **WHEN** status is changed to Done
- **THEN** the issue appears in the board's Done column

### Comments / activity

The activity feed MUST list comments reverse-chronologically with avatar + timestamp, and a composer MUST add a (mock) comment.

#### Scenario: Add a comment

- **GIVEN** the detail view
- **WHEN** a comment is submitted
- **THEN** it appears at the top of the activity feed with author + timestamp

## Design

### Approach

- Under `web/src/features/demo/issue/`: `IssueDetail` (Dialog/sheet), `StatusDropdown` (DropdownMenu), `DescriptionField`, `ActivityFeed`, `CommentComposer`, `DetailsPanel`.
- Wire board `Card` click (slot from 0005) to open `IssueDetail` for the selected key.
- Extend store: `selectedIssueKey`, `openIssue/closeIssue`, `setStatus(key,status)` (reuse/extend `moveIssue`), `addComment(key, body)`.
- Timestamps formatted via a small util (injectable "now" for deterministic tests).

### Decisions

- **Decision:** Reuse the store's transition action for both drag and dropdown.
  - **Why:** single source of truth; board and detail stay consistent.
  - **Alternatives:** separate detail-only status logic (drift risk, rejected).
- **Decision:** Injectable clock for timestamps.
  - **Why:** deterministic tests for "x minutes ago" formatting and comment ordering.

### Non-Goals

- No AI streaming panel or AI-generate-field buttons (0007) — `IssueDetail` exposes slots for them.
- No real persistence; comments are in-memory.

## Tasks

- [ ] Issue detail shell — `IssueDetail` modal + layout, open/close wiring from card, `DetailsPanel`; tests (open from card, fields shown)
- [ ] Status + description — `StatusDropdown` transitions (sync board), editable description; tests (transition reflects on board)
- [ ] Activity + comments — `ActivityFeed` + `CommentComposer`, `addComment`, time formatting util; tests (add comment, ordering, time format)
- [ ] Update `README.md` to note the issue detail view

## Open Questions

- [ ] Inline-edit summary/description vs read-with-edit-toggle — default: click-to-edit inline.
- [ ] Modal vs slide-over presentation — default: modal/dialog (closer to Jira's full issue modal).

## References

- Spec: [Demo Jira Clone](../specs/demo-jira-clone/)
- Related: [0005-demo-board](./0005-demo-board.md)
