# CLAUDE.md

Project guidance for working in this repository.

## Project

**Slop Simulator** — a parody SaaS marketing site for a fictional game ("Game Dev Tycoon, but for AI slop"). It ships:

- A single-page **marketing landing page** at `/` that parodies modern "AI / agentic" SaaS startup sites.
- An in-browser **demo** at `/demo` — a parody clone of Atlassian Jira where every feature is an exaggerated AI/agentic gag (tickets sport "Implement now with AI" buttons that spawn a fake streaming agent).

Everything is fictional parody, but every interaction MUST feel real: real timing, real streaming, real-looking UI.

See [`README.md`](README.md) for the product description and [`docs/`](docs/) for the living specs and change documents.

## Tech Stack

- **Runtime/build:** Bun + TypeScript
- **Frontend:** React + Motion (animations) + shadcn/ui (Tailwind)
- **Server:** a single Go server serves the built SPA and (future) API
- **Dev loop:** end-to-end hot reload — Go server (air) + Vite HMR proxied through the Go server, never run the SPA on a separate port for the user
- **Quality:** 100% test coverage is mandatory; GitHub Actions CI runs from the first scaffold

## Documentation Maintenance (IMPORTANT)

**Keep `README.md` in sync with what actually exists.** As features are implemented, removed, or materially changed, update `README.md` in the SAME change so its description never drifts from reality. When a change adds a user-facing capability, dev command, or alters the architecture, the README MUST be updated before that change is considered complete. Do not leave the README describing aspirational behavior as if it were shipped — clearly distinguish what exists from what is planned.

## Task Tracking

**You MUST load the `/project-management` skill before creating, modifying, or completing any task.** It owns all task-tracking rules and knows where tasks belong. Do not manage tasks without it.
