# 0003: Landing Page — parody AI-SaaS marketing site at `/`

## Summary

Implement the full single-page parody marketing site at `/` for "Slop Simulator", with all eleven sections, ship-ready parody copy, Motion animations, responsive layout, and a prominent Demo CTA routing to `/demo`.

**Spec:** [Landing Page](../specs/landing-page/)
**Status:** complete
**Depends On:** 0002

## Motivation

The landing page is the product's front door and a core deliverable: a premium-looking, fully polished parody of a 2025-era AI startup site. It must be complete (no placeholders) and must drive users into the demo.

## Requirements

### Testing Requirements

This change MUST satisfy the project's standing testing rules (see [Architecture › Testing & Coverage](../specs/architecture/index.md#testing--coverage)). CI enforces these as merge gates:

- 100% TS/React coverage via `vitest run --coverage` (V8) across statements, branches, functions, lines.
- Vitest (+ React Testing Library) for components and content/logic modules.
- Coverage thresholds MUST fail the run (and CI) below 100%.
- No `.only`; no unjustified `.skip`; any coverage exclusion MUST be explicitly listed with justification.
- ESLint + formatter MUST pass in CI.

Skipping or weakening any of these rules to land the PR MUST be treated as a bug in the PR, not in the rule.

### All sections with real parody content

The `/` route MUST render the eleven sections in [Landing Page › Page Structure](../specs/landing-page/#page-structure--sections) with the canonical parody copy and zero placeholder strings.

#### Scenario: Sections populated

- **GIVEN** `/`
- **WHEN** loaded
- **THEN** nav, hero, logo cloud, bento, how-it-works, stats, testimonials, pricing, FAQ, big CTA, and footer render with real content

### Demo CTA navigates client-side

A Demo CTA MUST be present in the sticky nav (all scroll positions) and at least one more in hero/big-CTA; activating it MUST route to `/demo` without full reload.

#### Scenario: Demo CTA routes

- **GIVEN** `/`
- **WHEN** the nav Demo button is clicked
- **THEN** the SPA navigates to `/demo` (no full reload)

### Animation, responsiveness, reduced motion

Sections MUST animate on scroll; stats MUST count up; pricing toggle + FAQ MUST animate; layout MUST work 320px→desktop with a mobile nav retaining the Demo CTA; all motion MUST respect `prefers-reduced-motion`.

#### Scenario: Mobile nav keeps Demo CTA

- **GIVEN** a 375px viewport
- **WHEN** the mobile menu opens
- **THEN** the Demo CTA is present and routes to `/demo`

#### Scenario: Reduced motion static

- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** scrolling `/`
- **THEN** content is visible without entrance transforms and no marquee/aurora loops run

## Design

### Approach

- Under `web/src/features/landing/`: route shell applies `data-theme="marketing"` via `ThemeScope`; section components (`Nav`, `Hero`, `LogoCloud`, `FeatureBento`, `HowItWorks`, `Stats`, `Testimonials`, `Pricing`, `Faq`, `BigCta`, `Footer`).
- All copy/data in typed modules (`content.ts`: features, stats, testimonials, pricing, faq) so content is testable and not buried in JSX.
- Use Design-System primitives (`Button`, `Accordion`, `Switch`, `Tooltip`, `Avatar`) and motion primitives (`FadeUp`, `Stagger`, `CountUp`, `Marquee`). Backdrops: aurora mesh, grain overlay, dot grid (marketing-theme treatments).
- Hero product mock: animated terminal/typewriter (default per spec Open Question).
- Local generated SVG logos/avatars; no external assets.

### Decisions

- **Decision:** Content as typed data modules.
  - **Why:** testable, single source of truth, avoids placeholder drift.
  - **Alternatives:** inline JSX copy (harder to test, rejected).
- **Decision:** Hero mock = terminal typewriter.
  - **Why:** on-theme, cheap, deterministically testable.
  - **Alternatives:** faux product UI / generative visual (deferred).

### Non-Goals

- No real auth/sign-up backend; "Log in"/sign-up CTAs are inert or route to demo.
- No CMS; content is static in-repo.

## Tasks

- [x] Landing shell + nav — route shell with `ThemeScope`, sticky glass nav with anchors + Demo CTA + mobile menu; tests (nav renders, Demo routes, mobile menu)
- [x] Hero + backdrops — hero with eyebrow/tagline/subhead/dual CTA + terminal typewriter mock; aurora/grain/grid; tests (content, CTA→/demo, reduced-motion)
- [x] Mid sections — LogoCloud (marquee), FeatureBento, HowItWorks (scroll-draw), Stats (count-up); content modules + tests
- [x] Conversion sections — Testimonials, Pricing (monthly/annual toggle), FAQ (accordion), BigCta (demo CTA), Footer; logic + tests (toggle math, accordion, CTA routing)
- [x] Update `README.md` landing-page description to reflect shipped content

## Open Questions

- [x] Exact mobile breakpoint for nav collapse — resolved: Tailwind `md` (768px); the nav collapses into the mobile menu below `md`.
- [x] Whether "Log in"/primary sign-up CTAs route to `/demo` or are inert — resolved: all secondary CTAs ("Log in", footer links, socials) route to `/demo` per the default.

## References

- Spec: [Landing Page](../specs/landing-page/)
- Related: [0002-design-system-foundation](./0002-design-system-foundation.md)
