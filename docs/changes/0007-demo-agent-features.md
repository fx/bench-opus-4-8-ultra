# 0007: Demo Agentic AI Parody — streaming agent, Autopilot, Ask Rovo, roster

## Summary

Implement the demo's core parody: the "✨ Implement now with AI" simulated streaming agent that "ships" tickets, plus the supporting AI gags — Agentic Autopilot, Ask Rovo command bar, AI-generate field buttons, the Rovo Agents roster, and agent activity/comments.

**Spec:** [Demo Jira Clone](../specs/demo-jira-clone/)
**Status:** draft
**Depends On:** 0005, 0006

## Motivation

This is the punchline of the whole product: features that look like real Jira AI but are absurdly exaggerated, with interactions (streaming, timing) that feel genuinely live. It depends on the board (cards/transitions) and issue detail (panel slots, activity feed).

## Requirements

### Testing Requirements

This change MUST satisfy the project's standing testing rules (see [Architecture › Testing & Coverage](../specs/architecture/index.md#testing--coverage)). CI enforces these as merge gates:

- 100% TS/React coverage via `vitest run --coverage` (V8) across statements, branches, functions, lines.
- Vitest (+ React Testing Library) for components, the agent engine, and store logic.
- The agent/autopilot simulation MUST be tested with **fake timers / an injectable clock** — tests MUST NOT depend on real elapsed time.
- Coverage thresholds MUST fail the run (and CI) below 100%, including cancellation and completion branches of the agent engine.
- No `.only`; no unjustified `.skip`; any coverage exclusion MUST be explicitly listed with justification.
- ESLint + formatter MUST pass in CI.

Skipping or weakening any of these rules to land the PR MUST be treated as a bug in the PR, not in the rule.

### Simulated streaming agent

Every card and the issue detail MUST surface "✨ Implement now with AI"; activating it MUST open an agent panel that streams scripted steps with realistic timing, then "ships" the issue to Done marked as agent-handled and logs the run in the activity feed. The user MUST be able to cancel mid-run.

#### Scenario: Agent ships a ticket

- **GIVEN** a To Do issue
- **WHEN** "Implement now with AI" runs to completion
- **THEN** steps stream incrementally with realistic timing, the issue ends in Done marked agent-handled, and the activity feed logs the run

#### Scenario: Streaming is incremental

- **GIVEN** a running step
- **WHEN** it streams
- **THEN** text appears over time (not all at once) with a visible caret, steps going running→done in order

#### Scenario: Cancel mid-run

- **GIVEN** a run in progress on a To Do issue
- **WHEN** the user cancels
- **THEN** streaming stops promptly and the issue is NOT marked Done

### Supporting parody features

The demo MUST also provide: an **Agentic Autopilot** board toggle that autonomously ships cards over time while ON; an **Ask Rovo** command bar returning over-confident absurd scripted answers; **AI-generate summary/description** buttons in issue detail; a **Rovo Agents roster** page with absurd hireable agents + fake stats.

#### Scenario: Autopilot autonomously ships

- **GIVEN** Autopilot OFF
- **WHEN** toggled ON and time advances
- **THEN** cards move toward Done automatically; toggling OFF halts further movement

#### Scenario: Ask Rovo answers absurdly

- **GIVEN** the Ask Rovo bar
- **WHEN** any query is submitted
- **THEN** a scripted, over-confident, citation-laden parody answer is shown

## Design

### Approach

- Under `web/src/features/demo/agent/`: a pure, deterministic **agent engine** that, given an issue, yields ordered `AgentStep`s and drives streaming through an **injectable clock**; exposes `start`, `tick`/advance, `cancel`, and emits progress + terminal events. `AgentPanel` renders the stream (caret, step states, terminal-style log).
- Under `rovo/`: `Autopilot` (toggle → timed autonomous `moveIssue` via the injectable clock with seeded jitter), `CommandBar` (query → scripted response selection), `AgentsRoster` page (sidebar route).
- Store extensions: `agentRun` state, `startAgent/cancelAgent`, completion side-effects (status→done, `handledByAgent`, append agent comment/activity), `autopilotEnabled` + tick handling, `askRovo(query)`.
- Wire the "Implement now with AI" action into the board `Card` slot (0005) and `IssueDetail` slot (0006); AI-generate buttons fill summary/description via scripted bloat text.
- All animations honor `prefers-reduced-motion`.

### Decisions

- **Decision:** Deterministic scripted engine with injectable clock (no LLM/network).
  - **Why:** must "feel live" yet be 100%-test-coverable with fake timers; offline and free.
  - **Alternatives:** real LLM (non-deterministic, networked, untestable to 100% — rejected).
- **Decision:** Word/chunk-based streaming.
  - **Why:** realistic feel without per-char overhead; tunable by the engine.
  - **Alternatives:** per-character (heavier) — configurable but not default.
- **Decision:** Autopilot and agent share the injectable clock abstraction.
  - **Why:** uniform deterministic testing of all time-driven autonomy.

### Non-Goals

- No real code generation or backend effects — purely cosmetic simulation.
- No persistence of runs beyond in-memory state (reset clears them).

## Tasks

- [ ] Agent engine — deterministic step scripts + injectable clock, `start`/`tick`/`cancel`, progress/terminal events; tests (streaming order, completion, cancellation) with fake timers
- [ ] Agent panel + card/detail wiring — `AgentPanel` (caret, step states, log), "Implement now with AI" on card + detail, completion side-effects (Done + agent-handled + activity); tests
- [ ] Autopilot + Ask Rovo — board Autopilot toggle (timed autonomy via clock), Ask Rovo command bar (scripted answers); tests (toggle on/off halts, query→answer) with fake timers
- [ ] Rovo Agents roster + AI-generate fields — roster page (absurd agents + stats, Hire/Assign), AI-generate summary/description buttons; tests
- [ ] Update `README.md` to describe the full agentic demo feature set

## Open Questions

- [ ] Streaming chunk size / per-step durations for the most convincing feel — tune during implementation (default word-chunked).
- [ ] Autopilot pacing (fixed vs jittered) — default jittered, seeded for test determinism.
- [ ] Whether AI-generate buttons also exist in the Create modal — default: include if Create modal is built; otherwise issue-detail only.

## References

- Spec: [Demo Jira Clone](../specs/demo-jira-clone/)
- Related: [0005-demo-board](./0005-demo-board.md), [0006-demo-issue-detail](./0006-demo-issue-detail.md)
- External: Atlassian Rovo (parody target) — https://www.atlassian.com/software/jira/ai
