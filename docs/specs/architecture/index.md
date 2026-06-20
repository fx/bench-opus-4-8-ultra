# Architecture

## Overview

Slop Simulator is a single-binary web application: one Go HTTP server serves a React single-page application (SPA) built with Bun, TypeScript, Vite, Motion, and shadcn/ui. The system MUST be runnable as one process in both development and production. In production the SPA assets MUST be embedded into the Go binary; in development a single Go server MUST provide full end-to-end hot reload (Vite HMR for the frontend AND Go auto-rebuild for the backend) through one address. The codebase MUST maintain 100% test coverage and MUST run GitHub Actions CI from the first scaffold.

This spec covers project-level concerns: tech stack, directory layout, build/serve/dev topology, the hot-reload contract, and the testing & CI conventions. Feature behavior lives in the [Landing Page](../landing-page/), [Demo Jira Clone](../demo-jira-clone/), and [Design System](../design-system/) specs.

## Background

The product is a parody: a fake SaaS marketing site (`/`) for a fictional game ("Slop Simulator", a parody of Game Dev Tycoon focused on "AI slop"), plus an in-browser parody of Atlassian Jira (`/demo`) whose every feature is an exaggerated "agentic AI" gag. Although the content is parody, all interactions MUST look and behave like a real, production-grade product.

The single-Go-server-serves-SPA topology is a deliberate, mandatory constraint: it prepares the project to grow a real HTTP API served from the same origin as the SPA, with no separate frontend dev server that the developer visits directly. Everything — static assets, client-side routes, and (future) API calls — MUST be reachable through the Go server's single port.

Key research backing the chosen topology:
- Go's `httputil.ReverseProxy` proxies WebSockets natively since Go 1.12, so Vite's HMR websocket can be proxied without manual connection hijacking.
- Vite's `server.hmr.clientPort` makes the browser open its HMR websocket back to the Go port rather than Vite's own port, which is what routes HMR through the single server.
- `air` (now `air-verse/air`) rebuilds the Go binary on `.go` changes; Vite runs as a separate long-lived process so frontend HMR state survives Go restarts.

## Requirements

### Single-Process Topology

- The system MUST be served to the user by exactly one Go HTTP server listening on one port (default `8080`, overridable via the `PORT` env var).
- The Go server MUST NOT require the user or developer to visit a separate Vite port directly; all traffic MUST go through the Go server's address.
- In production, the SPA's built assets MUST be embedded into the Go binary via `embed.FS` so the binary is fully self-contained (no external `dist/` directory required at runtime).
- The server MUST select dev vs. production behavior at runtime via the `APP_ENV` environment variable (`APP_ENV=dev` enables the Vite reverse proxy; any other value serves embedded assets).

#### Scenario: Production binary serves embedded SPA

- **GIVEN** the Go binary built with a populated embedded `dist/` and `APP_ENV` unset (or not `dev`)
- **WHEN** a user requests `GET /`
- **THEN** the server responds `200 OK` with the embedded `index.html` and never reaches out to a Vite process

#### Scenario: Single port for everything

- **GIVEN** the running server on port `8080`
- **WHEN** the user loads the landing page, navigates to `/demo`, and (in future) calls an API route
- **THEN** all three are served from `http://<host>:8080` with no other port involved

### Client-Side Routing / SPA Fallback

- The server MUST serve `index.html` for any client-side route that is not a real static asset and whose request `Accept` header includes `text/html`.
- The server MUST return a genuine `404 Not Found` for missing static assets (requests that do not accept `text/html`, e.g. a missing `.js` or `.png`), so broken asset references are not masked by the SPA fallback.
- The SPA MUST support at minimum two routes: `/` (landing page) and `/demo` (demo app), plus deep links within the demo.

#### Scenario: Deep link to demo route

- **GIVEN** the production server
- **WHEN** a user hard-navigates (full page load) to `/demo`
- **THEN** the server responds `200 OK` with `index.html` and the SPA client router renders the demo

#### Scenario: Missing asset returns 404

- **GIVEN** the production server
- **WHEN** a request arrives for `/assets/does-not-exist.js` with `Accept: */*`
- **THEN** the server responds `404 Not Found` (not `index.html`)

### End-to-End Hot Reload (Development)

- In `APP_ENV=dev`, the Go server MUST reverse-proxy all non-API requests to the Vite dev server, including Vite client assets (`/@vite/client`, `/@react-refresh`, `/src/*`) and the HMR websocket upgrade.
- Editing a frontend source file (`.ts`/`.tsx`/`.css`) MUST trigger Vite Fast Refresh through the Go port WITHOUT a full page reload and WITHOUT restarting the Go process.
- Vite's HMR `clientPort` MUST be derived from the Go server's port (the `PORT` env var, default `8080`) rather than hardcoded, so the single-port contract and HMR both hold when `PORT` is overridden.
- Editing a Go source file MUST trigger `air` to rebuild and restart the Go binary WITHOUT killing the Vite process, so frontend HMR state is preserved across Go restarts.
- A single developer command (`bun run dev`) MUST start both Vite and `air` as independent, concurrent processes.

#### Scenario: Frontend edit hot-reloads through the Go port

- **GIVEN** `bun run dev` running, browser open at the Go server port (default `http://localhost:8080`)
- **WHEN** the developer edits a React component's text
- **THEN** the change appears via HMR with no full reload, and the HMR websocket is connected to the Go server port (derived from `PORT`, default `8080`), not Vite's `5173`

#### Scenario: Backend edit reloads without dropping the frontend

- **GIVEN** `bun run dev` running with the app open
- **WHEN** the developer edits a `.go` file
- **THEN** `air` rebuilds and restarts the Go binary, Vite keeps running, and after the brief restart the page continues to function

### Testing & Coverage

- The project MUST maintain **100% test coverage** for all first-party code, both Go and TypeScript/React.
- Go code MUST be tested with the standard `go test` toolchain; coverage MUST be measured with `go test ./... -coverprofile=coverage.out` (the `-coverprofile` flag requires an output filename) and MUST report 100% of statements covered.
- TypeScript/React code MUST be tested with Vitest (+ React Testing Library for components); coverage MUST be measured via `vitest run --coverage` (V8 provider) and MUST report 100% across statements, branches, functions, and lines.
- Coverage thresholds MUST be configured to fail the test run (and therefore CI) when below 100%.
- Tests MUST NOT use `.only`; committed tests MUST NOT be skipped (`.skip`/`t.Skip`) without an explicit, justified, tracked reason.
- Code intentionally excluded from coverage (e.g. generated files, the `main()` bootstrap) MUST be explicitly listed in coverage config with a justification comment; excluding code merely to hit 100% is forbidden.

#### Scenario: Coverage gate fails a partially-tested change

- **GIVEN** a change that adds a function with an untested branch
- **WHEN** CI runs the coverage gate
- **THEN** the gate reports below-100% coverage and the CI job fails

### Continuous Integration

- A GitHub Actions workflow MUST exist from the first scaffold commit and MUST run on push and pull request to the default branch.
- CI MUST, at minimum: install Bun + Go, build the frontend, build the Go binary, run the Go test suite with coverage, run the Vitest suite with coverage, and enforce the 100% coverage gate.
- The first scaffold MAY satisfy the suite with placeholder tests, but the coverage gate and the full CI pipeline MUST be wired up and green from that first commit.
- CI MUST run a lint/format check for both Go (`gofmt`/`go vet`) and TypeScript (ESLint + the formatter).

#### Scenario: CI green on initial scaffold

- **GIVEN** the initial scaffold with placeholder tests
- **WHEN** CI runs on the scaffolding PR
- **THEN** all jobs pass, including the 100% coverage gate

## Design

### Architecture

```
                         ┌──────────────────────────────────────┐
   Browser  ───────────► │  Go HTTP server  (single port :8080)  │
   (one origin)          │                                       │
                         │   APP_ENV=dev          else (prod)    │
                         │   ┌───────────────┐   ┌─────────────┐ │
   /api/* (future) ────► │   │ API handlers  │   │ API handlers│ │
                         │   ├───────────────┤   ├─────────────┤ │
   / , /demo , assets ─► │   │ ReverseProxy ─┼─► │ embed.FS +  │ │
                         │   │   → Vite      │   │ SPA fallback│ │
                         │   └──────┬────────┘   └─────────────┘ │
                         └──────────┼───────────────────────────┘
                                    │ (dev only)
                                    ▼
                         ┌───────────────────────┐
                         │ Vite dev server :5173 │  (HMR, Fast Refresh)
                         │  long-lived process   │
                         └───────────────────────┘
```

- **Routing precedence in the Go mux:** real API routes (`/api/*`, future) are registered first; a catch-all handler serves the SPA. In dev the catch-all is the reverse proxy; in prod it is the embedded-FS + SPA-fallback handler.
- **Dev orchestration:** `bun run dev` runs `vite` and `air` concurrently (via `concurrently`). Vite owns frontend reloads; `air` owns Go reloads. The two never restart each other.

### Data Models

The application is, at spec time, entirely client-side and stateless on the server (the demo's data is mocked in the browser — see [Demo Jira Clone](../demo-jira-clone/)). The Go server has no database. Future API endpoints will be added under `/api/*`; this spec reserves that namespace but defines no endpoints yet.

### API Surface

- `GET /` → SPA (landing page)
- `GET /demo` and any non-asset path accepting `text/html` → SPA `index.html` (client routing)
- `GET /assets/*` → hashed static assets (long-cache)
- `GET /healthz` → `200 OK` plaintext liveness probe (server-owned, always served by Go in both modes)
- `/api/*` → reserved for future server API (no endpoints defined yet)

### Cache & Compression (production)

- Hashed assets under `/assets/*` MUST be served with `Cache-Control: public, max-age=31536000, immutable`.
- `index.html` MUST be served with `Cache-Control: no-cache` (always revalidate) so deploys take effect immediately.
- Static assets SHOULD be precompressed (brotli/gzip at build) and served with content negotiation; on-the-fly compression is acceptable as a fallback.

### Directory Structure

```
/
├── main.go                     # entrypoint: flag/env parsing, server bootstrap
├── go.mod / go.sum
├── internal/
│   └── server/
│       ├── server.go           # mux, route registration, mode selection
│       ├── server_test.go
│       ├── spa.go              # embed.FS + SPA-fallback handler (prod)
│       ├── spa_test.go
│       ├── proxy.go            # reverse proxy to Vite (dev)
│       └── proxy_test.go
├── web/                        # the Bun/Vite/React SPA
│   ├── embed.go                # package `web`: //go:embed all:dist → embed.FS (owns dist/)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── components.json         # shadcn/ui config
│   ├── src/
│   │   ├── main.tsx            # React root + router
│   │   ├── routes/             # / and /demo route trees
│   │   ├── components/         # shared + shadcn/ui primitives (ui/)
│   │   ├── features/
│   │   │   ├── landing/        # marketing page (see landing-page spec)
│   │   │   └── demo/           # jira parody (see demo-jira-clone spec)
│   │   ├── lib/                # utilities (cn, fake-agent engine, mock data)
│   │   └── styles/             # global css, theme tokens
│   └── dist/                   # build output (embedded in prod; gitignored)
├── .air.toml
├── Makefile or package.json scripts
├── .github/workflows/ci.yml
├── docs/                       # specs, changes, indexes
├── README.md
└── CLAUDE.md
```

> Note: `web/dist/` is embedded by a `web` package (`web/embed.go`) that owns the directory, because `//go:embed` cannot reference parent directories — a package under `internal/server` could not embed the repo-level `web/dist`. The embedded `embed.FS` is injected into `internal/server`. Because `//go:embed` requires the target to exist at compile time, the build pipeline MUST produce `web/dist/` before `go build`, and a committed `.gitkeep` (or an embed of a directory guaranteed to exist) MUST keep the package compilable on a clean checkout. The exact embed wiring is finalized in change 0001.

### Business Logic

There is no server-side business logic at spec time beyond request routing, mode selection, and static serving. All "agentic AI" behavior in the demo is a client-side simulation (see [Demo Jira Clone](../demo-jira-clone/)).

## Constraints

- **Single origin/port:** all traffic through one Go port; no direct Vite access for the user.
- **Self-contained prod binary:** assets embedded via `embed.FS`; no runtime filesystem dependency for assets.
- **HMR fidelity:** dev edits to frontend MUST Fast-Refresh; Go edits MUST not drop the Vite session.
- **100% coverage:** merge-blocking, enforced in CI for both languages.
- **Performance:** parody interactions MUST feel real (realistic timing for fake streaming); the marketing page MUST honor `prefers-reduced-motion`.
- **Browser support:** current evergreen browsers (Chrome, Firefox, Safari, Edge). No IE.

## Open Questions

- **Dev/prod toggle mechanism** — Options: (a) `APP_ENV` env var at runtime [current default], (b) Go build tags to exclude proxy code from the prod binary. Default to `APP_ENV` for simplicity; revisit if prod binary size or excluding `httputil` from prod matters.
- **Precompression library** — Options: `vearutop/statigz` (precompressed embed + ETags) vs. on-the-fly `CAFxX/httpcompression`. Default to `statigz` with build-time brotli; acceptable to defer to a later change.
- **Router library** — Options: React Router vs. a minimal hand-rolled router (only two top-level routes). Default to React Router for familiarity and future growth; finalized in change 0001.

## References

- [Design System](../design-system/) — shadcn/ui, Tailwind, Motion foundations
- [Landing Page](../landing-page/) — marketing page behavior
- [Demo Jira Clone](../demo-jira-clone/) — demo app behavior
- Go 1.12 release notes — `httputil.ReverseProxy` native WebSocket proxying
- Go 1.22 `http.FileServerFS` — filesystem serving
- Vite Backend Integration guide — https://vite.dev/guide/backend-integration
- `air-verse/air` — Go live reload — https://github.com/air-verse/air
- `olivere/vite` (Go ↔ Vite manifest integration), `vearutop/statigz` (precompressed embed serving)
- Matteo Gassend, "Developing and Compiling Webapps with Vite and Go" — https://matteogassend.com/articles/go-webapp-vite

## Changelog

| Date | Change | Document |
|------|--------|----------|
| 2026-06-20 | Initial spec created | — |
| 2026-06-20 | Project scaffold defined | [0001-project-scaffold](../../changes/0001-project-scaffold.md) |
