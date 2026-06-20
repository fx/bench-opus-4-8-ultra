# Documentation

## Specs

| Spec | Description | Status |
|------|-------------|--------|
| [Architecture](specs/architecture/) | Single Go server serving a Bun/Vite/React SPA with end-to-end HMR, 100% coverage, and CI. | active |
| [Demo Jira Clone](specs/demo-jira-clone/) | In-browser parody of Jira at /demo with exaggerated agentic-AI features and a simulated streaming agent. | active |
| [Design System](specs/design-system/) | shadcn/ui + Tailwind + Motion foundation with scoped marketing (dark) and Jira (light) themes. | active |
| [Landing Page](specs/landing-page/) | Parody AI-SaaS marketing landing page at / with a prominent Demo CTA. | active |

## Changes

| # | Change | Spec | Status | Depends On |
|---|--------|------|--------|------------|
| 0001 | [Project Scaffold](changes/0001-project-scaffold.md) | [Architecture](specs/architecture/) | complete | — |
| 0002 | [Design System Foundation](changes/0002-design-system-foundation.md) | [Design System](specs/design-system/) | complete | 0001 |
| 0003 | [Landing Page](changes/0003-landing-page.md) | [Landing Page](specs/landing-page/) | draft | 0002 |
| 0004 | [Demo App Shell](changes/0004-demo-app-shell.md) | [Demo Jira Clone](specs/demo-jira-clone/) | complete | 0002 |
| 0005 | [Demo Board](changes/0005-demo-board.md) | [Demo Jira Clone](specs/demo-jira-clone/) | draft | 0004 |
| 0006 | [Demo Issue Detail](changes/0006-demo-issue-detail.md) | [Demo Jira Clone](specs/demo-jira-clone/) | draft | 0005 |
| 0007 | [Demo Agent Features](changes/0007-demo-agent-features.md) | [Demo Jira Clone](specs/demo-jira-clone/) | draft | 0005, 0006 |
