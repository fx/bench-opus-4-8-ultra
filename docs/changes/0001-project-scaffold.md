# 0001: Project Scaffold — Go server + Bun/Vite/React SPA + end-to-end HMR + CI

## Summary

Scaffold the entire project: a single Go HTTP server that serves a Bun + TypeScript + React (Vite) SPA, with full end-to-end hot reload in development (Vite HMR + `air` Go reload through one port) and embedded static serving in production, plus a GitHub Actions CI pipeline enforcing 100% coverage from the first commit.

**Spec:** [Architecture](../specs/architecture/)
**Status:** complete
**Depends On:** —

## Motivation

Nothing exists yet beyond a README. Every other change depends on this scaffold. The single-Go-server-serves-SPA topology with end-to-end HMR is a mandatory architectural constraint (preparing for a real same-origin API), and 100% coverage + CI must be live from the very first commit so quality gates never lag behind the code.

## Requirements

### Testing Requirements

This change MUST satisfy the project's standing testing rules (see [Architecture › Testing & Coverage](../specs/architecture/index.md#testing--coverage)). CI enforces these as merge gates:

- 100% test coverage MUST be maintained for all first-party code — Go via `go test ./... -coverprofile`, TS/React via `vitest run --coverage` (V8 provider) across statements, branches, functions, and lines.
- Go uses the standard `go test` toolchain; TS/React uses Vitest (+ React Testing Library for components).
- Coverage thresholds MUST be configured to fail the run (and therefore CI) when below 100%.
- No `.only` in committed tests; no `.skip`/`t.Skip` without a justified, tracked reason; any coverage exclusion MUST be explicitly listed with a justification comment.
- CI MUST run lint/format checks for both Go (`gofmt -l`, `go vet`) and TS (ESLint + formatter).

Skipping or weakening any of these rules to land the PR MUST be treated as a bug in the PR, not in the rule.

### Single Go server with mode selection

The Go server MUST serve everything on one port (default `8080`, `PORT` overridable) and select dev vs prod via `APP_ENV` (`dev` → Vite reverse proxy; else embedded assets).

#### Scenario: Prod mode serves embedded index

- **GIVEN** the built binary with `APP_ENV` unset
- **WHEN** `GET /` is requested
- **THEN** the embedded `index.html` is returned `200 OK`

#### Scenario: Dev mode proxies to Vite

- **GIVEN** the server with `APP_ENV=dev` and Vite running on `:5173`
- **WHEN** `GET /` is requested
- **THEN** the response is proxied from Vite (HMR client present)

### SPA fallback & health

The server MUST serve `index.html` for non-asset routes accepting `text/html`, return real `404` for missing assets, and expose `GET /healthz` → `200` in both modes.

#### Scenario: Deep link served

- **GIVEN** prod mode
- **WHEN** `GET /demo` with `Accept: text/html`
- **THEN** `index.html` is returned `200`

#### Scenario: Missing asset 404s

- **GIVEN** prod mode
- **WHEN** `GET /assets/missing.js` with `Accept: */*`
- **THEN** `404 Not Found`

### End-to-end HMR via one dev command

`bun run dev` MUST start Vite and `air` concurrently; frontend edits Fast-Refresh through the Go port; Go edits restart the binary without killing Vite.

#### Scenario: HMR routes through Go port

- **GIVEN** `bun run dev`
- **WHEN** the browser connects HMR
- **THEN** the HMR websocket targets the Go port (via `hmr.clientPort`), not `:5173`

## Design

### Approach

- **Go side:** `main.go` boots `internal/server`. `internal/server` registers `/healthz` and `/api/*` (reserved) first, then a catch-all: dev → `httputil.ReverseProxy` to the Vite dev server (native websocket proxying, no manual hijack); prod → serve the embedded SPA via `embed.FS` + `fs.Sub` + `http.FileServerFS` wrapped with an `Accept`-aware SPA-fallback handler and the cache-control split (assets immutable, `index.html` no-cache). The embedded FS is injected into the server constructor (rather than embedded inside `internal/server`) — see Embed bootstrap.
- **Embed bootstrap:** `//go:embed` directives cannot reference parent directories, so a package under `internal/server` cannot embed the repo-level `web/dist`. The embed MUST live in a package that *owns* the directory: add `web/embed.go` (package `web`) with `//go:embed all:dist` exposing an `embed.FS`, and have `main.go`/`internal/server` consume it. Commit a minimal `web/dist/.gitkeep` (or placeholder `index.html`) so that package compiles on a clean checkout before the frontend is built; the real build overwrites `web/dist/`.
- **Frontend side:** `web/` with Bun, Vite, `@vitejs/plugin-react`, TypeScript, React, React Router (two routes `/` and `/demo`, placeholder pages here). `vite.config.ts`: `server.port=5173`, `strictPort=true`, `build.outDir=dist`, and `hmr.clientPort` derived from the Go server port — read `process.env.PORT` (default `8080`) so HMR stays on whatever single port the Go server uses, honoring the `PORT` override. The `dev` script MUST pass the same `PORT` to both the Go binary and Vite.
- **Dev orchestration:** root `package.json`/Makefile `dev` script runs `concurrently -n vite,go "bun --cwd web run dev" "air"` with `PORT` exported to both processes. `.air.toml` rebuilds Go only (`include_ext=["go"]`, `exclude_dir` covers `web`, `node_modules`, `dist`), `send_interrupt`, `stop_on_error`, runs binary with `APP_ENV=dev`.
- **CI:** `.github/workflows/ci.yml` — setup Go + Bun, `bun install`, build frontend (`bun --cwd web run build`), `go build`, `go test ./... -race -coverprofile=coverage.out` + 100% gate, `vitest run --coverage` + 100% threshold, lint (`gofmt`, `go vet`, ESLint).

### Decisions

- **Decision:** Runtime `APP_ENV` toggle (not build tags).
  - **Why:** simplest ops, one binary; proxy code in prod binary is negligible.
  - **Alternatives:** build tags to exclude proxy from prod (deferred; see Architecture Open Questions).
- **Decision:** Vite + air as independent processes via `concurrently`.
  - **Why:** keeps Vite alive across Go restarts so HMR state survives.
  - **Alternatives:** air managing Vite (rejected — kills HMR on every Go save).
- **Decision:** React Router for client routing.
  - **Why:** familiar, room to grow; only two routes today.
  - **Alternatives:** hand-rolled router (unnecessary).

### Non-Goals

- No design system / theming yet (change 0002).
- No landing or demo feature content (changes 0003+); routes render minimal placeholders.
- No real API endpoints (namespace reserved only).
- No precompression yet (may be added later; basic correct cache headers only).

## Tasks

- [x] Go server core — `main.go`, `internal/server` mux, mode selection, `/healthz`, `/api/*` reservation, with tests
  - [x] SPA-fallback + embed handler (`spa.go`) with `Accept`-aware fallback, real-404, cache headers + tests
  - [x] Dev reverse-proxy handler (`proxy.go`) to Vite incl. websocket passthrough + tests (httptest)
  - [x] `embed.FS` bootstrap — `web/embed.go` (package `web`, `//go:embed all:dist`) injected into the server, plus committed `web/dist/index.html` placeholder so the package compiles clean pre-build
- [x] Frontend scaffold — `web/` Bun + Vite + React + TS + React Router, two placeholder routes (`/`, `/demo`), `vite.config.ts` HMR settings, base test (Vitest + RTL) for the router
- [x] Dev hot-reload wiring — `.air.toml`, root `dev` script (`concurrently`), verify frontend HMR + Go reload through one port
- [x] Tooling & quality config — ESLint + Prettier, `vitest.config.ts` with 100% thresholds, Go coverage gate script, `.gitignore` (incl. `web/dist`, `tmp`)
- [x] GitHub Actions CI — `.github/workflows/ci.yml` running build + Go tests/coverage + Vitest/coverage + lint, green on this PR
- [x] Update `README.md` to reflect the scaffolded stack and the single `bun run dev` workflow

## Open Questions

- [x] Embed placeholder strategy — **Resolved:** commit a minimal placeholder `web/dist/index.html` (not a bare `.gitkeep`). It keeps `//go:embed all:dist` compiling on a clean checkout AND gives the prod SPA handler a readable `index.html` so the server is exercisable before the real Vite build. `.gitignore` force-keeps that one file (`/web/dist/*` + `!/web/dist/index.html`); the real build overwrites it.
- [x] Add `-race` to the Go CI step from day one — **Resolved: yes.** CI runs `go test -race -covermode=atomic`; the suite is race-clean.

## References

- Spec: [Architecture](../specs/architecture/)
- External: Vite Backend Integration (https://vite.dev/guide/backend-integration), `air-verse/air` (https://github.com/air-verse/air), Go `httputil.ReverseProxy` websocket support (Go 1.12+), `http.FileServerFS` (Go 1.22+)
