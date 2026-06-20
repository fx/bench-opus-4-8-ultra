# 0004: Demo App Shell — Jira-look chrome, routing, state foundation

## Summary

Build the `/demo` application shell: the Jira-look-alike chrome (top nav, collapsible left sidebar, main content area), the demo route tree, the client-side state store, and the seeded mock dataset that later demo changes build on.

**Spec:** [Demo Jira Clone](../specs/demo-jira-clone/)
**Status:** complete
**Depends On:** 0002

## Motivation

The demo needs a convincing Jira chrome and a state foundation before the board, issue detail, and agent features can be implemented. Establishing the store, types, and seed data here keeps subsequent demo changes focused and testable.

## Requirements

### Testing Requirements

This change MUST satisfy the project's standing testing rules (see [Architecture › Testing & Coverage](../specs/architecture/index.md#testing--coverage)). CI enforces these as merge gates:

- 100% TS/React coverage via `vitest run --coverage` (V8) across statements, branches, functions, lines.
- Vitest (+ React Testing Library) for components, store, and data modules.
- Coverage thresholds MUST fail the run (and CI) below 100%.
- No `.only`; no unjustified `.skip`; any coverage exclusion MUST be explicitly listed with justification.
- ESLint + formatter MUST pass in CI.

Skipping or weakening any of these rules to land the PR MUST be treated as a bug in the PR, not in the rule.

### Jira chrome

`/demo` MUST render a fixed top nav (app-switcher, wordmark, primary nav items, blue Create button, search, right cluster + AI entry) and a collapsible left sidebar (SLOP project context + view list incl. Board and Rovo Agents), styled with Jira theme tokens.

#### Scenario: Chrome renders

- **GIVEN** `/demo`
- **WHEN** loaded
- **THEN** top nav + collapsible sidebar render with Jira styling and SLOP project context

#### Scenario: Sidebar collapses

- **GIVEN** the shell
- **WHEN** the collapse control is toggled
- **THEN** the sidebar folds to an icon rail and content reflows

### State foundation + seed

The demo MUST hold all state client-side from a deterministic seed and SHOULD expose a reset.

#### Scenario: Deterministic seed

- **GIVEN** a fresh `/demo` load
- **WHEN** the store initializes
- **THEN** it contains the seeded issues/users/project deterministically

#### Scenario: Reset restores seed

- **GIVEN** mutated demo state
- **WHEN** reset is invoked
- **THEN** state returns to the seed

## Design

### Approach

- Under `web/src/features/demo/`: `chrome/` (`AppShell`, `TopNav`, `Sidebar`), route shell applies `data-theme="jira"`.
- `data/` — types (`Issue`, `User`, `Comment`, `Status`, etc. per spec) + seed dataset (≥12 parody issues, users incl. the "Rovo Ultra" agent user, SLOP project).
- `store/` — Zustand store with state + actions (placeholders for board/agent actions wired in later changes) + `reset()`.
- Main content area renders a placeholder board container (real board in 0005) so the shell is independently shippable.

### Decisions

- **Decision:** Zustand for demo state.
  - **Why:** ergonomic, minimal boilerplate, easy to unit-test actions in isolation.
  - **Alternatives:** context + reducer (more boilerplate, rejected).
- **Decision:** Seed + types land here, ahead of the board.
  - **Why:** lets the board/issue/agent changes consume a stable, tested data layer.

### Non-Goals

- No board interactions (0005), issue detail (0006), or agent features (0007) yet.
- App-switcher/search/Create are visual (wired where relevant in later changes).

## Tasks

- [x] Demo route shell + chrome — `AppShell`, `TopNav`, `Sidebar` (collapsible) with Jira theme; tests (render, collapse, nav items present)
- [x] Data layer — types + seed dataset (≥12 issues, users incl. agent, SLOP project); tests (seed shape/determinism)
- [x] State store — Zustand store with base state, selectors, `reset()`; tests for store actions/reset
- [x] Update `README.md` to note the `/demo` app shell

## Open Questions

- [ ] Confirm Zustand vs context+reducer (default Zustand).
- [ ] Sidebar persistence of collapsed state (in-memory only vs `localStorage`) — default in-memory.

## References

- Spec: [Demo Jira Clone](../specs/demo-jira-clone/)
- Related: [0002-design-system-foundation](./0002-design-system-foundation.md)
