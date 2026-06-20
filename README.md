# Slop Simulator

> The world's first fully autonomous slop engine. *(It's a parody.)*

**Slop Simulator** is a parody web project with two faces:

1. A **marketing landing page** (`/`) that lovingly skewers modern "AI / agentic" SaaS startup sites — dark, premium, gradient-soaked, dripping with buzzwords — selling a fictional game called *Slop Simulator* (think *Game Dev Tycoon*, but the entire business is generating AI slop).
2. An in-browser **interactive demo** (`/demo`) that masquerades as Atlassian Jira, where every feature is an exaggerated "agentic AI" gag. Tickets sport flashy **"✨ Implement now with AI"** buttons; clicking one spawns a fake AI agent that *streams* its way through "implementing" the feature and triumphantly ships the ticket to Done.

Everything is fictional parody — but every interaction is built to feel completely real: real timing, real streaming output, real-looking UI.

> **Status:** Scaffold + design system landed, the **landing page (`/`) ships in
> full**, and the **demo app shell, its Kanban board, and the issue detail view
> (`/demo`) are in place**. A single Go server serves a Bun/Vite/React SPA with
> end-to-end hot reload in dev and embedded assets in prod, behind a
> 100%-coverage CI gate. The `/demo` route now renders the Jira-look-alike shell
> (chrome, store, seed) with a working **drag-and-drop Kanban board** and a
> **two-column issue detail view** (status transitions, editable description,
> activity feed + comments) opened by clicking a card (see *What exists now*); the
> remaining demo features (the streaming agent, Autopilot, Ask Rovo, roster) are
> still **planned**. See [`docs/`](docs/) for the living specifications and change
> documents that drive implementation. As features ship, this README is updated to
> describe what actually exists.

---

## What exists now (scaffold)

- A single **Go HTTP server** (`main.go` + `internal/server`) that serves
  everything on one port (default `8080`, override with `PORT`) and selects its
  mode from `APP_ENV`:
  - **dev** (`APP_ENV=dev`) — reverse-proxies all non-API requests to the Vite
    dev server (including the HMR websocket), so the browser only ever talks to
    the Go port.
  - **prod** (default) — serves the SPA from assets **embedded into the binary**
    via `embed.FS`, with `Accept`-aware SPA fallback, genuine `404`s for missing
    assets, and the cache-control split (hashed assets immutable, `index.html`
    no-cache).
- `GET /healthz` liveness probe (both modes) and a reserved `/api/*` namespace
  (no endpoints yet).
- A **Bun + Vite + React + TypeScript** SPA under [`web/`](web/) with React
  Router and two placeholder routes (`/`, `/demo`).
- **End-to-end hot reload** via one command: `bun run dev` runs Vite and `air`
  concurrently; frontend edits Fast-Refresh through the Go port, Go edits
  rebuild the binary without dropping Vite.
- **100% test coverage** for both Go and TypeScript, enforced by a coverage gate
  in **GitHub Actions CI** (build + tests + coverage + lint) that runs on every
  push and PR to `main`.
- A **design-system foundation** under [`web/src`](web/src): Tailwind CSS +
  shadcn/ui primitives (button, dialog, dropdown-menu, accordion, tooltip,
  avatar, badge, switch, input, tabs, scroll-area) styled through CSS-variable
  tokens, a `cn()` class-merge helper, self-hosted fonts (Geist, Geist/JetBrains
  Mono, Inter — no CDN), two **scoped themes** (`data-theme="marketing"` dark
  violet/Geist and `data-theme="jira"` light blue/Inter, applied via a
  `ThemeScope` wrapper and isolated from each other), and centralized **Motion**
  primitives (`FadeUp`, `Stagger`, `CountUp`, `Marquee`, shared easings) gated by
  a single `useReducedMotionSafe` hook that honors `prefers-reduced-motion`.
- The **landing page** at `/` (under [`web/src/features/landing`](web/src/features/landing)) —
  a single, polished parody of a top-tier AI-SaaS marketing site, scoped to the
  marketing theme. It ships all eleven sections: a sticky glass nav (announcement
  pill, in-page anchors, mobile menu) with a prominent **Demo** button that routes
  to `/demo` client-side; a hero with an animated terminal-typewriter product
  mock, parody tagline, and dual CTA; an aurora/grain/dot-grid backdrop; a logo-
  cloud marquee; an asymmetric feature bento; a scroll-drawn "how it works"; a
  count-up stats band; testimonials; a pricing table with a monthly/annual toggle;
  an FAQ accordion; a big closing CTA; and a footer. All copy/data lives in a typed
  `content.ts` module, every motion path respects `prefers-reduced-motion`, the
  layout works from 320px up, and all assets (logos, avatars) are locally generated
  SVG — no external/CDN calls.
- The **demo app shell** under
  [`web/src/features/demo`](web/src/features/demo): the `/demo` route now renders
  a Jira-look-alike chrome — a fixed top nav (app-switcher, "Slop Jira" wordmark,
  primary nav, blue **Create**, search, and an "Ask Rovo" AI entry point) and a
  **collapsible** left sidebar (the `SLOP` project context plus the view list,
  including **Board** and **Rovo Agents**), all scoped to `data-theme="jira"` and
  responsive down to 320px (the sidebar auto-collapses to an icon rail below
  `lg`). Demo state lives in a client-side **Zustand store** seeded from a
  deterministic mock dataset (the `SLOP` project, parody users including the
  "Rovo Ultra" agent, and 14 parody issues across all four columns), with
  selectors and a `reset()` that restores the seed exactly. The agent features
  are still **planned** (see below).

- The **demo Kanban board** under
  [`web/src/features/demo/board`](web/src/features/demo/board): the main content
  area renders the four ordered columns (**To Do · In Progress · In Review ·
  Done**), each with a name and a **live issue count** derived from store
  selectors. Cards show the full Jira meta — an optional epic lozenge, the
  summary, optional labels, then a footer with the coloured issue-type icon
  (Story/Task/Bug/Epic/Sub-task), the `SLOP-###` key, a priority chevron, a
  story-points badge and the assignee avatar (agent-handled work gets a violet
  ring + "Rovo" marker). Cards are **draggable between columns** via
  [`@dnd-kit/core`](https://dndkit.com) — including an accessible **keyboard
  sensor** — and a drop dispatches a pure `moveIssue` store transition that
  updates the issue's status and both affected column counts. The transition
  logic lives in the store (unit-tested in isolation), separate from the dnd
  wiring. Clicking a card opens the **issue detail view** (below); each card also
  exposes a slot for the later "Implement now with AI" action (0007) without
  implementing it yet.

- The **demo issue detail view** under
  [`web/src/features/demo/issue`](web/src/features/demo/issue): clicking a board
  card opens a Jira-style full-issue **modal** (built on the design-system
  `Dialog`) with a two-column layout. The **left** column shows the issue key +
  type, the summary, a coloured **status dropdown** (built on `DropdownMenu`), a
  **click-to-edit inline description** (Save / Cancel, with Cmd/Ctrl+Enter to
  save and Escape to cancel), and an **activity feed** with a working (mock)
  **comment composer** — new comments are prepended so they appear at the top
  with their author avatar and a relative timestamp. The **right** column is a
  **Details panel** (assignee, reporter, priority, labels, story points, sprint,
  epic, created/updated), rendering an explicit placeholder for every empty
  field. Changing the status flows through the **same** pure store transition the
  board's drag uses, so the board reflects the new column immediately (single
  source of truth); closing the modal (Escape, overlay, or the close button)
  returns to the board. Relative timestamps come from a small util with an
  **injectable "now"** for deterministic tests, and the detail exposes slots for
  the 0007 streaming-agent panel and AI-generate-field buttons without
  implementing them yet.

## Development

Prerequisites: [Bun](https://bun.sh), [Go](https://go.dev) 1.26+, and
[`air`](https://github.com/air-verse/air) (`go install github.com/air-verse/air@latest`).

```sh
# install dependencies — root (concurrently, used by `bun run dev`) and the web app
bun install
bun install --cwd web

# run the whole stack with end-to-end hot reload (visit http://localhost:8080)
bun run dev

# build the production frontend (emits web/dist/, embedded by the Go binary)
bun run build && go build -o slop-simulator .

# tests + 100% coverage gates
bun run test:go     # Go tests (-race) + coverage gate
bun run test:web    # Vitest + 100% coverage thresholds
```

> `PORT` is honored by both the Go server and Vite's HMR client port, so the
> single-port contract holds even when you override it (`PORT=3000 bun run dev`).

---

## What's planned

### The demo (`/demo`)

A convincing Jira look-alike whose every feature is a joke (the chrome shell —
top nav, collapsible sidebar, store, and seed — the **drag-and-drop Kanban
board**, and the **issue detail view** already exist; see *What exists now*; the
items below remain planned):

- **"✨ Implement now with AI"** on every ticket — opens an agent panel that streams scripted, plausible implementation steps in real time and then "ships" the ticket
- **Agentic Autopilot** — flip it on and watch tickets ship themselves
- **Ask Rovo** — an AI command bar that answers any question with over-confident, citation-laden nonsense
- A **Rovo Agents** roster of absurd hireable agents (Standup Bot, Scope Creep Detector, Blame Assigner, Velocity Inflator…)
- AI-generate buttons that fill fields with bloated buzzword soup

All demo data is mocked in the browser; the "AI" is a deterministic, scripted simulation (no real model, no network).

---

## Tech stack

- **Bun** + **TypeScript** + **React**
- **Motion** for animation (centralized primitives shipped — see *What exists now*)
- **shadcn/ui** (Tailwind CSS) for components (foundation shipped — see *What exists now*)
- A single **Go** server serves the React SPA — embedded into the binary in production, and in development providing **full end-to-end hot reload** (Vite HMR for the frontend *and* Go auto-rebuild) through one port, in preparation for a real same-origin API
- **100% test coverage** (Go + Vitest) enforced by **GitHub Actions CI** from the first commit

---

## Documentation

- [`docs/index.md`](docs/index.md) — index of all specifications and change documents
- [`docs/specs/`](docs/specs/) — living specs (architecture, design-system, landing-page, demo-jira-clone)
- [`docs/changes/`](docs/changes/) — change documents tracking the work to build them

See [**Development**](#development) above for how to run, build, and test the scaffold.

---

*© 2026 Slop Simulator, Inc. No humans were consulted in the making of this product.*
