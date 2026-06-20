# Landing Page

## Overview

The Landing Page is the single-page marketing site at `/`. It MUST parody a modern "AI / agentic" SaaS startup marketing page (Vercel/Linear/Framer/Cursor genre) for the fictional game "Slop Simulator". The visual design MUST look genuinely premium and on-trend; the copy MUST be pure parody dripping with "AI", "agentic", and "autonomous" buzzwords. The page MUST include a prominent, persistent "Demo" call-to-action that links to `/demo`. It MUST be fully responsive, animated with Motion, honor `prefers-reduced-motion`, and contain no placeholder content.

## Background

"Slop Simulator" is a parody of Game Dev Tycoon focused entirely on generating "AI slop". The landing page sells this fictional game as if it were a hot AI startup. The page uses the marketing (dark) theme defined in the [Design System](../design-system/) and the motion primitives defined there. It is a single scrolling page with anchored sections; the only navigation off-page is the "Demo" link to `/demo`.

The parody lives in the words, not the craft: layout, spacing, animation, and polish MUST be indistinguishable from a real top-tier SaaS site.

## Requirements

### Page Structure & Sections

The page MUST be a single vertical scroll composed of these sections, in order:

1. **Announcement bar + sticky nav** — a thin announcement pill above a glass sticky nav. Nav MUST contain the Slop Simulator wordmark (left), in-page anchor links (center: Features, How it works, Pricing, FAQ), and right-side actions: a ghost "Log in" and a filled primary CTA. A **prominent "Demo" link/button MUST be present in the nav** and MUST route to `/demo`.
2. **Hero** — eyebrow pill, large parody tagline, subhead, dual CTA (primary "Deploy your first agent" + a secondary that leads to the demo), and an animated product mock (e.g. a terminal/typewriter or a faux product UI). Aurora mesh gradient + grain + dot grid behind.
3. **Logo cloud / social proof** — "Trusted by teams shipping slop at…" with a marquee of fictional company logos/wordmarks.
4. **Feature bento grid** — an asymmetric grid of 6–8 parody "agentic" feature tiles, each with icon, name, one-liner, and a small visual/micro-animation.
5. **How it works** — 3 numbered steps with a scroll-drawn connecting line.
6. **Metrics/stats band** — 4–6 absurd stats with count-up animation.
7. **Testimonials** — 3–4 parody testimonials with avatar, name, absurd title, and fake company.
8. **Pricing** — 3 tiers with a monthly/annual toggle; the middle tier marked "Most popular" and visually elevated.
9. **FAQ** — an accordion of 5–8 parody Q&A items.
10. **Big CTA** — a full-bleed aurora panel with one bold line and a single button (to the demo or sign-up).
11. **Footer** — multi-column link grid, a status pill ("All agents operational"), socials, a giant ghosted "SLOP" wordmark, and parody fine print.

All content MUST be real (no "lorem ipsum", no TODO). Copy MUST follow the parody direction below.

#### Scenario: All sections render with real content

- **GIVEN** the landing page at `/`
- **WHEN** it loads
- **THEN** all eleven sections render populated with the specified parody content and zero placeholder strings

### Demo Call-to-Action

- A "Demo" entry point MUST be visible in the sticky nav at all scroll positions (the nav is sticky), and at least one additional demo CTA MUST appear in the hero and/or big-CTA section.
- Activating any "Demo" CTA MUST navigate the SPA to `/demo` via client-side routing (no full page reload).

#### Scenario: Demo link navigates to the demo

- **GIVEN** the landing page
- **WHEN** the user clicks the nav "Demo" button
- **THEN** the SPA routes to `/demo` without a full page reload

### Animation & Motion

- Sections MUST animate in on scroll using the shared fade-up + stagger primitives from the [Design System](../design-system/).
- The hero MUST include a continuous ambient animation (e.g. drifting aurora gradient and/or a typewriter in the product mock).
- The logo cloud and/or testimonials MUST include a marquee.
- The stats band MUST count up when scrolled into view.
- The pricing toggle MUST animate price changes; the FAQ MUST animate expand/collapse.
- All of the above MUST be disabled/reduced under `prefers-reduced-motion` (no transform animations, no infinite loops).

#### Scenario: Stats count up once on view

- **GIVEN** a user scrolling to the stats band (reduced motion OFF)
- **WHEN** the band enters the viewport
- **THEN** each number animates from 0 to its target exactly once

#### Scenario: Reduced motion shows static page

- **GIVEN** a user with `prefers-reduced-motion: reduce`
- **WHEN** they load and scroll the page
- **THEN** content is fully visible without entrance transforms and no marquee/aurora loops run

### Responsiveness

- The page MUST be fully usable and visually correct from a 320px mobile width up to large desktop.
- The nav MUST collapse into a mobile menu (sheet/drawer) below a defined breakpoint, retaining the Demo CTA.
- Multi-column sections (bento, pricing, footer) MUST reflow to single/stacked columns on mobile.

#### Scenario: Mobile nav retains Demo CTA

- **GIVEN** a 375px-wide viewport
- **WHEN** the user opens the mobile nav menu
- **THEN** the Demo CTA is present and routes to `/demo`

## Design

### Architecture

- Lives under `web/src/features/landing/`. The route container applies `data-theme="marketing"` (see [Design System › Theme Scoping](../design-system/index.md#theme-scoping)).
- Composed of section components (`Nav`, `Hero`, `LogoCloud`, `FeatureBento`, `HowItWorks`, `Stats`, `Testimonials`, `Pricing`, `Faq`, `BigCta`, `Footer`), each a self-contained component.
- Content (copy, feature list, testimonials, pricing, FAQ) MUST be defined as typed data modules (e.g. `features/landing/content.ts`) so it is testable and not hard-coded inside JSX.

### Data Models

Typed content structures (illustrative):

```ts
type Feature = { icon: string; name: string; description: string };
type Testimonial = { quote: string; name: string; title: string; company: string };
type PricingTier = { name: string; priceMonthly: number | null; priceAnnual: number | null; blurb: string; features: string[]; popular?: boolean };
type FaqItem = { question: string; answer: string };
type Stat = { value: number; suffix?: string; label: string };
```

### Parody Content (canonical, ship-ready)

- **Eyebrow:** `v4.0 · now with multi-agent slopflows ✦`
- **Tagline:** "The world's first fully autonomous slop engine." (subhead: "Slop Simulator deploys a swarm of reasoning agents that ideate, generate, and self-publish content while you focus on your Series A. No taste required.")
- **Primary CTA:** "Deploy your first agent" · **Secondary CTA:** "Watch the slop ▶" (→ `/demo`)
- **Features (bento):** Agentic Slopflows; Hype Copilot; Autonomous Monetization Engine; Reasoning-Native Asset Forge; Self-Healing Roadmap; Slop Orchestration Layer; Vibe-to-Revenue Pipeline; Human-out-of-the-Loop Mode (one-liners per the design brief).
- **Stats:** 10× more slop per sprint · 99.99% agent uptime · <50ms time-to-slop · 1.2M+ agents deployed · 0 developers required · 4.9★ vibe rating.
- **Testimonials:** Brock Tensor (Chief Slop Officer, Synergy.ai); Dr. Madison Liquidity (Founder & Head of Reasoning, ParadigmZero); Tate Blockchain-Williams (VP of Autonomous Outcomes, HyperLoop Labs); Priya Stakeholder (Interim Chief Vibes Architect, Moonshot Industries).
- **Pricing:** Hobby Slop (Free); Pro Agentic ($99/mo, "Most popular"); Enterprise Singularity ("Talk to an agent").
- **FAQ:** "Is the slop actually any good?"; "Do I still need game developers?"; "What does 'agentic' mean here?"; "Is my data used to train the slop?"; "Can the agents become sentient?"; "What's your uptime?" (answers per the design brief).
- **Footer:** status pill "◦ All agents operational"; ghosted "SLOP" wordmark; fine print "© 2026 Slop Simulator, Inc. No humans were consulted in the making of this product."

### UI Components

Each section uses Design-System primitives (shadcn `Button`, `Accordion`, `Switch`, `Tooltip`, `Avatar`) and motion primitives (`FadeUp`, `Stagger`, `CountUp`, `Marquee`). The aurora/grain/grid backdrops are shared marketing-theme treatments.

### Business Logic

- Pricing monthly/annual toggle computes displayed price from tier data.
- Stats count-up driven by the shared `CountUp` primitive (reduced-motion aware).
- FAQ accordion open/close state.

## Constraints

- Visuals MUST be premium and on-trend; parody is in copy only.
- MUST honor `prefers-reduced-motion`.
- 100% test coverage (see [Architecture › Testing](../architecture/index.md#testing--coverage)): content data, the toggle/count-up/accordion logic, the demo-navigation wiring, and reduced-motion branches MUST all be covered.
- No external network calls; all assets (logos, avatars) MUST be local SVG/generated, not hotlinked.

## Open Questions

- **Hero product mock** — animated terminal/typewriter vs. a faux mini product UI vs. a looping "slop generation" visualization. Default: animated terminal/typewriter (cheap, on-theme, testable). Finalized in change 0003.
- **Avatars/logos** — generated initials/abstract SVGs vs. illustrated marks. Default: locally generated SVG marks and initial-avatars to avoid external assets.

## References

- [Design System](../design-system/) — marketing theme + motion primitives
- [Architecture](../architecture/) — routing, testing
- [Demo Jira Clone](../demo-jira-clone/) — target of the Demo CTA

## Changelog

| Date | Change | Document |
|------|--------|----------|
| 2026-06-20 | Initial spec created | — |
| 2026-06-20 | Landing page implementation defined | [0003-landing-page](../../changes/0003-landing-page.md) |
