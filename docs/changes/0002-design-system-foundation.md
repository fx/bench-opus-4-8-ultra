# 0002: Design System Foundation — shadcn/ui, Tailwind, Motion, dual themes

## Summary

Establish the shared UI foundation: Tailwind CSS, shadcn/ui primitives, the font program, the two scoped themes (marketing dark + Jira light), and the centralized Motion animation primitives with global `prefers-reduced-motion` handling.

**Spec:** [Design System](../specs/design-system/)
**Status:** draft
**Depends On:** 0001

## Motivation

Both the landing page and the demo need a consistent, tested primitive layer before feature work begins. The two surfaces use opposite aesthetics that MUST be isolated within one bundle, and animations MUST share one source of easings/variants with one reduced-motion gate. Building this once prevents divergent, untested ad-hoc styling later.

## Requirements

### Testing Requirements

This change MUST satisfy the project's standing testing rules (see [Architecture › Testing & Coverage](../specs/architecture/index.md#testing--coverage)). CI enforces these as merge gates:

- 100% TS/React coverage via `vitest run --coverage` (V8) across statements, branches, functions, lines.
- Vitest (+ React Testing Library) for all components, hooks, and utilities.
- Coverage thresholds MUST fail the run (and CI) below 100%.
- No `.only`; no unjustified `.skip`; any coverage exclusion MUST be explicitly listed with justification.
- ESLint + formatter MUST pass in CI.

Skipping or weakening any of these rules to land the PR MUST be treated as a bug in the PR, not in the rule.

### shadcn/ui + Tailwind

The project MUST configure Tailwind with token-driven CSS variables and shadcn/ui (`components.json`), with primitives under `web/src/components/ui/` and a `cn()` helper.

#### Scenario: cn merges classes

- **GIVEN** `cn("p-2", condition && "p-4")`
- **WHEN** evaluated with `condition` true
- **THEN** the conflicting `p-2` is replaced by `p-4` (tailwind-merge)

### Scoped dual themes

Marketing (`data-theme="marketing"`) and Jira (`data-theme="jira"`) themes MUST drive distinct token values and MUST NOT bleed into each other.

#### Scenario: Theme tokens isolated

- **GIVEN** a primitive rendered under each theme scope
- **WHEN** computed styles are inspected
- **THEN** each uses its own theme tokens (marketing violet/Geist vs Jira blue/Inter)

### Motion primitives + reduced motion

Centralized `FadeUp`, `Stagger`, `CountUp`, `Marquee`, and shared easings MUST exist; all MUST honor `prefers-reduced-motion`.

#### Scenario: Reduced motion short-circuits

- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** a `FadeUp`/`CountUp`/`Marquee` renders
- **THEN** no transform/infinite animation runs (content visible; CountUp shows final value immediately)

## Design

### Approach

- Install + configure Tailwind, `tailwindcss-animate`, shadcn/ui (`components.json`), self-hosted fonts (Geist, Geist/JetBrains Mono, Inter).
- Define theme tokens as CSS variables under `[data-theme="marketing"]` and `[data-theme="jira"]` in `web/src/styles/`, mapped to Tailwind semantic colors/radius (per Design System spec token tables).
- Add core shadcn primitives needed soon: button, dialog, dropdown-menu, accordion, tooltip, avatar, badge, switch, input, tabs, scroll-area.
- Build `web/src/components/motion/`: easing constants, `FadeUp`, `Stagger`, `CountUp` (rAF + injectable timing for tests), `Marquee`, and a `useReducedMotionSafe` hook consulted by all of them.
- Add a `ThemeScope` wrapper component that sets `data-theme` for a subtree (used by route shells in 0003/0004).

### Decisions

- **Decision:** `data-theme` attribute scoping driving CSS variables.
  - **Why:** lets one set of shadcn primitives serve both themes; no duplicate components.
  - **Alternatives:** separate component sets per theme (duplication, rejected).
- **Decision:** Self-hosted fonts via bundled packages.
  - **Why:** deterministic, offline, embed-friendly; no external requests.
  - **Alternatives:** CDN/Google Fonts (external dependency, rejected).
- **Decision:** Single `useReducedMotionSafe` gate consumed by all primitives.
  - **Why:** central enforcement; testable; no per-component drift.

### Non-Goals

- No feature sections/pages (changes 0003+).
- Not every shadcn primitive — only those needed by upcoming changes (more added on demand).

## Tasks

- [ ] Tailwind + shadcn setup — `tailwind.config.ts`, `components.json`, `cn()` util, global CSS, fonts; tests for `cn`
- [ ] Theme tokens + `ThemeScope` — marketing & Jira CSS-variable token sets, `ThemeScope` component + tests (asserts `data-theme` applied)
- [ ] Core shadcn primitives — add the listed primitives under `components/ui/` with render/interaction tests
- [ ] Motion primitives — easings, `FadeUp`, `Stagger`, `CountUp`, `Marquee`, `useReducedMotionSafe`; tests incl. reduced-motion branches (fake timers for `CountUp`)
- [ ] Update `README.md` design-system/tech section if architecture details changed

## Open Questions

- [ ] Final font packages (Fontsource vs vendored `.woff2`) — confirm in implementation.
- [ ] Whether `Marquee` duplicates its track in DOM (for seamless loop) in a way that needs test adjustment.

## References

- Spec: [Design System](../specs/design-system/)
- Related: [0001-project-scaffold](./0001-project-scaffold.md)
- External: shadcn/ui (https://ui.shadcn.com), Motion (https://motion.dev), Atlassian color (https://atlassian.design/foundations/color)
