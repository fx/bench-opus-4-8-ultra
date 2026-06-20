# Design System

## Overview

The Design System spec defines the shared visual and interaction foundation for both surfaces of Slop Simulator: the dark, premium "AI startup" marketing theme used by the [Landing Page](../landing-page/), and the light "Atlassian/Jira" theme used by the [Demo Jira Clone](../demo-jira-clone/). It MUST establish the component library (shadcn/ui on Tailwind CSS), the animation library (Motion), the font program, design tokens for both themes, and the reusable animation/utility primitives. The two themes MUST be able to coexist in one SPA without leaking styles into each other.

## Background

The product deliberately presents two opposite aesthetics in one app:

1. **Marketing surface (`/`)** — a parody of 2025-era AI/agentic SaaS landing pages (Vercel/Linear/Framer/Cursor genre): dark-first, electric accent, mesh/aurora gradients, grain overlay, glassmorphism, tight-tracked Geist-style type. The visuals MUST be played 100% straight (genuinely premium); only the copy is parody.
2. **Demo surface (`/demo`)** — a convincing clone of Atlassian Jira Cloud: light, dense, Atlaskit-blue, Inter type, lozenges and soft elevations.

Because these are visually incompatible, the design system MUST scope each theme so that demo components never inherit marketing styles and vice versa. shadcn/ui is the shared primitive layer; both themes restyle the same primitives via CSS variables.

## Requirements

### Component Library Foundation

- The project MUST use shadcn/ui (Radix primitives + Tailwind) as the component foundation, configured via `components.json`.
- Tailwind CSS MUST be configured with design tokens (CSS variables) for color, radius, and typography.
- shadcn/ui primitives MUST be added on demand (button, dialog, dropdown-menu, accordion, tooltip, avatar, badge, switch, input, tabs, scroll-area, etc.) and MUST live under `web/src/components/ui/`.
- The `cn()` class-merge utility (clsx + tailwind-merge) MUST exist and be used for conditional classes.

#### Scenario: shadcn primitive renders in both themes

- **GIVEN** a shadcn `Button` primitive
- **WHEN** it is rendered inside the marketing theme scope and inside the demo theme scope
- **THEN** it adopts each theme's tokens (colors/radius) without code duplication of the primitive

### Theme Scoping

- The marketing theme and the demo theme MUST each be applied via a scoped wrapper (e.g. a `data-theme="marketing"` / `data-theme="jira"` attribute or a theme class on a route-level container), driving distinct CSS-variable values.
- Demo (Jira) components MUST NOT inherit marketing fonts, colors, or radius, and marketing components MUST NOT inherit Jira styling.
- Global resets/utilities MAY be shared, but theme-specific tokens MUST be confined to their scope.

#### Scenario: Themes do not bleed

- **GIVEN** the SPA with the landing page and demo both mountable
- **WHEN** the demo route is rendered
- **THEN** computed styles for demo surfaces use Jira tokens (e.g. primary `#0052CC`, Inter), not marketing tokens (violet accent, Geist)

### Typography Program

- The marketing theme MUST use a Geist-style display/UI sans (Geist Sans, with Inter as an acceptable fallback) and a mono accent (Geist Mono / JetBrains Mono) for eyebrows, metrics, and terminal/code snippets.
- The demo theme MUST use Inter (a faithful, free stand-in for Atlassian's "Charlie") as its UI font.
- Fonts MUST be self-hosted or loaded in a way that does not block first paint; the marketing display type MUST apply tight tracking (`letter-spacing` ≈ `-0.03em` to `-0.04em`) on large headings.

### Motion / Animation Primitives

- The project MUST use Motion (the `motion` package, framer-motion lineage) for animation.
- The design system MUST provide reusable, centralized animation primitives so feature code does not re-declare easings/variants ad hoc, including at minimum:
  - **fade-up on scroll** variant (`opacity 0→1`, `y 24→0`, viewport-once)
  - **staggered children** container variant
  - shared **easing curves** (a strong ease-out, e.g. `[0.22, 1, 0.36, 1]`)
  - **count-up** number animation hook/component
  - **marquee** (infinite horizontal scroll) component
- All animations MUST honor `prefers-reduced-motion`: when reduced motion is requested, transform-based motion MUST be disabled (opacity-only or no animation) across the app.

#### Scenario: Reduced motion disables transforms

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** any animated section enters the viewport
- **THEN** it appears without translate/scale animation (at most a fade), and no infinite looping transform animations run

### Accessibility Baseline

- Interactive primitives MUST be keyboard-operable and expose accessible names/roles (inherited from Radix where applicable).
- Color contrast for text MUST meet WCAG AA in both themes for body and interactive text.
- Focus states MUST be visible in both themes.

## Design

### Token Architecture

Tokens are CSS variables defined per theme scope. Tailwind maps semantic utility names to these variables so the same class (`bg-primary`, `text-foreground`, `rounded-md`) resolves differently per theme.

**Marketing theme (dark) — directional values:**

```css
[data-theme="marketing"] {
  --background: 0 0% 4%;          /* #0A0A0A near-black canvas */
  --panel: 0 0% 9%;               /* #171717 */
  --card: 0 0% 11%;               /* #1C1C1C raised */
  --foreground: 0 0% 96%;
  --muted-foreground: 0 0% 64%;
  --primary: 252 100% 68%;        /* violet #7C5CFF */
  --slop: 84 100% 62%;            /* chartreuse #B6FF3C secondary */
  --border: 0 0% 100% / 0.08;     /* hairline */
  --radius: 0.75rem;              /* 12px cards; buttons 6–8px */
}
```

Marketing surface treatments (documented for the landing-page spec to consume): aurora mesh gradient (2–3 blurred radial blobs of `--primary` at 15–30% opacity), SVG grain overlay at 3–6% opacity with `mix-blend-mode: overlay`, faint dot/grid backdrop, glass nav (`rgba(255,255,255,0.04)` + `backdrop-filter: blur(12px)`), CTA glow (`box-shadow: 0 0 40px -8px rgba(124,92,255,0.6)`).

**Demo theme (light, Atlaskit-derived) — directional values:**

```css
[data-theme="jira"] {
  --background: 0 0% 100%;        /* #FFFFFF surfaces */
  --page: 220 23% 97%;            /* #F4F5F7 page bg */
  --foreground: 218 54% 20%;      /* #172B4D text */
  --muted-foreground: 215 16% 47%;/* #6B778C subtle */
  --primary: 214 100% 40%;        /* #0052CC Jira blue */
  --primary-hover: 215 91% 34%;   /* #0747A6 */
  --border: 214 17% 90%;          /* #DFE1E6 */
  --radius: 0.25rem;              /* ~3–4px */
}
```

Jira lozenge tokens (status categories): To Do = neutral gray (`#EBECF0`/`#42526E`), In Progress = blue (`#DEEBFF`/`#0052CC`), Done = green (`#E3FCEF`/`#006644`), Blocked/Removed = red (`#FFEBE6`/`#DE350B`). Issue-type colors: Story green `#36B37E`, Task blue `#2684FF`, Bug red `#FF5630`, Epic purple `#6554C0`, Sub-task light blue. Priority chevrons: Highest/High red-orange, Medium amber `#FFAB00`, Low/Lowest green.

### Component Hierarchy

- `web/src/components/ui/*` — shadcn/ui primitives (theme-agnostic; styled via tokens).
- `web/src/components/motion/*` — animation primitives (`FadeUp`, `Stagger`, `CountUp`, `Marquee`, easing constants, `useReducedMotionSafe`).
- `web/src/lib/cn.ts` — class-merge helper.
- Feature components live under `features/landing/*` and `features/demo/*` and compose the above.

### Business Logic

The only logic in this layer is the reduced-motion gate: a single hook/util that reads `prefers-reduced-motion` and is consulted by every animation primitive, so the behavior is centrally enforced rather than per-component.

## Constraints

- Two themes MUST be visually isolated within one SPA bundle.
- Motion primitives MUST be the single source of easings/variants; feature code MUST NOT hand-roll easings.
- 100% test coverage applies: every primitive, hook, and the token/theme switching logic MUST be unit-tested (see [Architecture › Testing](../architecture/index.md#testing--coverage)). Visual styling that cannot be asserted in JSDOM MUST still have its conditional logic (class application, reduced-motion branching, count-up math) covered.

## Open Questions

- **Theme application mechanism** — `data-theme` attribute on a route container vs. separate CSS layers. Default: `data-theme` attribute set by the route shell. Finalized in change 0002.
- **Font delivery** — self-hosted `.woff2` (Geist, Inter, JetBrains Mono) vs. Fontsource packages. Default: self-hosted via Fontsource-style npm packages bundled by Vite, for offline/embed determinism.
- **Animating count-up under JSDOM** — count-up uses `requestAnimationFrame`; tests MUST use fake timers / RTL to assert final value and reduced-motion short-circuit.

## References

- [Architecture](../architecture/) — build, testing, structure
- [Landing Page](../landing-page/) — consumer of the marketing theme + motion primitives
- [Demo Jira Clone](../demo-jira-clone/) — consumer of the Jira theme
- shadcn/ui — https://ui.shadcn.com
- Motion — https://motion.dev
- Atlassian Design System (color/tokens) — https://atlassian.design/foundations/color
- Geist font — https://vercel.com/font

## Changelog

| Date | Change | Document |
|------|--------|----------|
| 2026-06-20 | Initial spec created | — |
| 2026-06-20 | Design system foundation defined | [0002-design-system-foundation](../../changes/0002-design-system-foundation.md) |
