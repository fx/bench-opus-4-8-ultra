# Slop Simulator

> The world's first fully autonomous slop engine. *(It's a parody.)*

**Slop Simulator** is a parody web project with two faces:

1. A **marketing landing page** (`/`) that lovingly skewers modern "AI / agentic" SaaS startup sites — dark, premium, gradient-soaked, dripping with buzzwords — selling a fictional game called *Slop Simulator* (think *Game Dev Tycoon*, but the entire business is generating AI slop).
2. An in-browser **interactive demo** (`/demo`) that masquerades as Atlassian Jira, where every feature is an exaggerated "agentic AI" gag. Tickets sport flashy **"✨ Implement now with AI"** buttons; clicking one spawns a fake AI agent that *streams* its way through "implementing" the feature and triumphantly ships the ticket to Done.

Everything is fictional parody — but every interaction is built to feel completely real: real timing, real streaming output, real-looking UI.

> **Status:** Scaffold landed. The project skeleton — a single Go server that
> serves a Bun/Vite/React SPA with end-to-end hot reload in dev and embedded
> assets in prod, plus a 100%-coverage CI gate — now exists and runs. The
> product **features** below (landing page, demo app) are still **planned**;
> the routes currently render minimal placeholders. See [`docs/`](docs/) for the
> living specifications and change documents that drive implementation. As
> features ship, this README is updated to describe what actually exists.

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

### Landing page (`/`)

A single, polished scrolling page in the style of top-tier AI startup sites:

- Sticky glass nav with a prominent **Demo** link to `/demo`
- Hero with an animated product mock and parody tagline ("The world's first fully autonomous slop engine")
- A bento grid of absurd "agentic" features (Agentic Slopflows, Hype Copilot, Autonomous Monetization Engine, Human-out-of-the-Loop Mode…)
- "How it works" steps, an animated stats band (10× more slop per sprint, 0 developers required…), parody testimonials, pricing tiers (Hobby Slop → Pro Agentic → Enterprise Singularity), an FAQ, and a big closing call-to-action
- Smooth scroll/entrance animations throughout, with full `prefers-reduced-motion` support

### The demo (`/demo`)

A convincing Jira look-alike whose every feature is a joke:

- Faithful Jira chrome — top nav, collapsible sidebar, and a **Kanban board** (To Do / In Progress / In Review / Done) with draggable, richly-detailed issue cards
- An **issue detail** view with status transitions, a details panel, and an activity feed
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
