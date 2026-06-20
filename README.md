# Slop Simulator

> The world's first fully autonomous slop engine. *(It's a parody.)*

**Slop Simulator** is a parody web project with two faces:

1. A **marketing landing page** (`/`) that lovingly skewers modern "AI / agentic" SaaS startup sites — dark, premium, gradient-soaked, dripping with buzzwords — selling a fictional game called *Slop Simulator* (think *Game Dev Tycoon*, but the entire business is generating AI slop).
2. An in-browser **interactive demo** (`/demo`) that masquerades as Atlassian Jira, where every feature is an exaggerated "agentic AI" gag. Tickets sport flashy **"✨ Implement now with AI"** buttons; clicking one spawns a fake AI agent that *streams* its way through "implementing" the feature and triumphantly ships the ticket to Done.

Everything is fictional parody — but every interaction is built to feel completely real: real timing, real streaming output, real-looking UI.

> **Status:** Specification phase. This README describes the **planned** product. See [`docs/`](docs/) for the living specifications and change documents that drive implementation. As features ship, this README is updated to describe what actually exists.

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

## Planned tech stack

- **Bun** + **TypeScript** + **React**
- **Motion** for animation
- **shadcn/ui** (Tailwind CSS) for components
- A single **Go** server serves the React SPA — embedded into the binary in production, and in development providing **full end-to-end hot reload** (Vite HMR for the frontend *and* Go auto-rebuild) through one port, in preparation for a real same-origin API
- **100% test coverage** (Go + Vitest) enforced by **GitHub Actions CI** from the first commit

---

## Documentation

- [`docs/index.md`](docs/index.md) — index of all specifications and change documents
- [`docs/specs/`](docs/specs/) — living specs (architecture, design-system, landing-page, demo-jira-clone)
- [`docs/changes/`](docs/changes/) — change documents tracking the work to build them

*No setup or usage instructions yet — they'll be added here as the scaffold lands.*

---

*© 2026 Slop Simulator, Inc. No humans were consulted in the making of this product.*
