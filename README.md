# Slop Simulator

> The world's first fully autonomous slop engine. *(It's a parody.)*

**Slop Simulator** is a parody web project with two faces:

1. A **marketing landing page** (`/`) that lovingly skewers modern "AI / agentic" SaaS startup sites — dark, premium, gradient-soaked, dripping with buzzwords — selling a fictional game called *Slop Simulator* (think *Game Dev Tycoon*, but the entire business is generating AI slop).
2. An in-browser **interactive demo** (`/demo`) that masquerades as Atlassian Jira, where every feature is an exaggerated "agentic AI" gag. Tickets sport flashy **"✨ Implement now with AI"** buttons; clicking one spawns a fake AI agent that *streams* its way through "implementing" the feature and triumphantly ships the ticket to Done.

Everything is fictional parody — but every interaction is built to feel completely real: real timing, real streaming output, real-looking UI.

> **Status:** Feature-complete. The **landing page (`/`)** ships in full and the
> **demo (`/demo`)** is complete — the Jira-look-alike shell, the drag-and-drop
> Kanban board, the issue detail view, **and the full agentic-AI parody** (the
> streaming "Implement now with AI" agent, Agentic Autopilot, Ask Rovo, the Rovo
> Agents roster, and AI-generate fields) are all in place. A single Go server
> serves a Bun/Vite/React SPA with end-to-end hot reload in dev and embedded
> assets in prod, behind a 100%-coverage CI gate. See [`docs/`](docs/) for the
> living specifications and change documents that drove implementation. As
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
  selectors and a `reset()` that restores the seed exactly. The "Ask Rovo" nav
  entry and the "Rovo Agents" sidebar item are live (see *The agentic-AI parody*
  below).

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
  surfaces the "✨ Implement now with AI" action on hover (see *The agentic-AI
  parody* below).

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
  **injectable "now"** for deterministic tests, and the detail hosts the
  streaming-agent panel and the AI-generate-field buttons described below.

- **The agentic-AI parody** under
  [`web/src/features/demo/agent`](web/src/features/demo/agent) and
  [`web/src/features/demo/rovo`](web/src/features/demo/rovo) — the demo's
  punchline, built to *feel* genuinely live while being a deterministic, offline,
  fully-testable simulation (no LLM, no network):
  - **"✨ Implement now with AI"** on every board card (hover slot) and in the
    issue detail. Activating it opens an **agent panel** that streams a scripted,
    terminal-style implementation log — ordered steps that transition
    running → done with a blinking caret and word-by-word streaming — then
    **"ships" the issue to Done**, marks it agent-handled, and records an
    agent-authored run log in the activity feed. The user can **cancel mid-run**:
    streaming stops promptly and the issue is left untouched (not Done). The
    streaming is a *pure function of elapsed time* driven through an **injectable
    clock**, so it's tested deterministically with fake timers (both the
    completion and cancellation paths). Under `prefers-reduced-motion` the run
    skips the slow reveal and shows the final result immediately.
  - **Agentic Autopilot** — a board toggle that, while ON, autonomously ships
    cards toward Done over time (seeded jitter via the same injectable clock);
    toggling OFF halts further movement.
  - **Ask Rovo** — the top-nav command bar opens a dialog that answers any query
    with an over-confident, citation-laden, absurd **scripted** answer (citing
    papers that do not exist).
  - **Rovo Agents roster** — a sidebar destination listing absurd hireable agents
    (Standup Bot, Scope Creep Detector, Blame Assigner, Velocity Inflator…) with
    fabricated utilization/shipped stats and **Hire / Assign** actions.
  - **AI-generate** sparkle buttons in the issue detail that fill the
    summary/description with buzzword-bloat text and post an agent "Reply with AI"
    comment — all through the store.
  - Every introduced text-on-color (agent status, the AI buttons, roster avatars,
    Autopilot/Ask Rovo chrome, citation chips) clears **WCAG AA**, locked by
    contrast-guard tests; all JS-driven motion consults `useReducedMotionSafe`.

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

## Roadmap

Both faces of the product — the landing page (`/`) and the full Jira-parody demo
(`/demo`, including the agentic-AI features) — are now implemented; see *What
exists now*, the project's feature work is complete. The architecture reserves an
`/api/*` namespace on the Go server for a future same-origin API, but no endpoints
are defined yet. All demo data remains mocked in the browser and the "AI" is a
deterministic, scripted simulation (no real model, no network).

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

---

## Bench Run Analysis

This project was built end-to-end by an autonomous Claude Code `/team` run.
The breakdown below — token usage, estimated cost, per-agent and per-PR
tables, and the cache split — was produced by the [`analyze-bench-run`](.claude/skills/analyze-bench-run)
skill (run `python3 .claude/skills/analyze-bench-run/scripts/analyze.py`).
Cost is a list-price estimate at Opus 4.8 rates and excludes discounts;
cache-read dominates token *volume* (~96%) but is cheap, so "billed tokens"
is far larger than tokens actually generated.

```text
========================================================================================================
PER-AGENT / SESSION BREAKDOWN   (/home/vscode/.claude/projects/-workspace-bench-opus-4-8-ultra)
========================================================================================================
agent/session                  turns tools    input  cache_wr     cache_rd   output    wall     cost
----------------------------------------------------------------------------------------------------
main:28d56421                    679   273   82,651 4,086,894  189,107,201  663,037  11h24m  $152.41
main:c89942a2                     83    41   35,704   811,294   12,685,412   79,883  50m57s   $16.63
coder-0001                       397   229  172,778 1,680,157   47,178,271   73,847  30m48s   $36.80
ultra-verify-pr1                  78    45   36,252   430,661    4,695,852   15,767   5m06s    $5.61
ultra-judge-pr1                   35    22   28,290   179,223    1,537,248    4,477   1m45s    $2.14
coder-0002                       411   246   76,026   492,935   54,873,960   77,098  31m09s   $32.83
ultra-verify-pr2                 163    98   41,850   355,348   15,064,436   23,238   9m56s   $10.54
ultra-judge-pr2                   39    21   26,720   218,434    1,666,145    5,282   2m23s    $2.46
coder-0003                       576   349  224,779 3,082,410  111,249,368  109,656   1h34m   $78.76
coder-0004                       461   256  194,138 4,598,490   78,993,060   89,227   2h18m   $71.44
ultra-verify-pr4                 159    98   38,011   368,453   14,448,978   16,314   8m27s   $10.13
ultra-design-pr4                 141    83   32,919   367,641   12,344,471   30,308  11m05s    $9.39
ultra-verify-pr3                 119    69   36,588   373,455   10,305,280   24,725   8m33s    $8.29
ultra-design-pr4-rerun           139    83   32,594   260,254    9,722,416   22,393   9m06s    $7.21
ultra-design-pr3                 137    83   45,398   309,175   11,215,491   21,533   8m19s    $8.31
ultra-design-pr4-final           111    65   33,322   235,564    7,285,248   17,971   6m25s    $5.73
ultra-judge-pr4                   44    26   25,684   159,076    1,919,331    6,893   2m54s    $2.25
ultra-design-pr3-rerun            90    55   30,509   252,592    4,904,218   13,691   5m14s    $4.53
ultra-design-pr3-final            79    44   27,830   187,582    4,478,182   15,095   4m59s    $3.93
ultra-judge-pr3                   58    34   29,686   247,067    3,181,432   10,509   3m28s    $3.55
coder-0005                       598   350  230,924 3,536,749  111,068,303  111,296   1h20m   $81.58
ultra-verify-pr5                 115    69   33,784   290,078    9,471,920   18,420   7m37s    $7.18
ultra-design-pr5                 114    70   36,315   353,087    8,739,906   19,372   6m07s    $7.24
ultra-design-pr5-final            88    52   30,580   212,506    5,634,433   16,692   6m44s    $4.72
ultra-design-pr5-confirm         108    65   31,192   267,715    8,244,482   21,841   7m04s    $6.50
ultra-design-pr5-last            139    83   46,511   314,237   11,910,804   24,549   9m42s    $8.77
ultra-judge-pr5                   50    30   29,478   205,230    2,548,630    7,562   2m59s    $2.89
coder-0006                       428   248  148,223 3,073,020   74,374,923   86,000   1h58m   $59.28
ultra-verify-pr6                 181   117   35,782   257,574   17,278,915   19,315  10m06s   $10.91
ultra-design-pr6                 127    75   58,875   526,654   10,304,093   24,333   9m20s    $9.35
ultra-design-pr6-rerun           144    89   32,976   218,833   10,030,761   16,235   8m35s    $6.95
ultra-judge-pr6                   62    31   28,858   193,279    3,506,810    9,425   4m21s    $3.34
coder-0007                       647   369  191,455 8,667,237  152,893,162  156,701   3h09m  $135.49
ultra-verify-pr7                 156    97   38,561   442,024   16,831,599   24,608   9m43s   $11.99
ultra-design-pr7                 241   136   42,592   396,848   28,920,863   44,611  16m32s   $18.27
ultra-design-pr7-rerun           163    97   36,166   255,645   12,760,017   32,870  11m27s    $8.98
ultra-judge-pr7                   55    31   28,844   199,233    3,039,631    9,412   3m30s    $3.14
----------------------------------------------------------------------------------------------------
TOTAL (37 logs)                 7415  42292,332,84538,106,6541,084,415,2521,964,186          $859.51

========================================================================================================
BY ROLE
========================================================================================================
role                 #   turns     output         billed      cost
orchestrator         2     762    742,920    207,552,076   $169.04
coder                7    3518    703,825    657,704,193   $496.17
ultra-verifier       7     971    142,387     91,017,788    $64.65
ultra-designer      14    1821    321,494    151,492,991   $109.86
ultra-judge          7     343     53,560     19,051,889    $19.79

========================================================================================================
TOKEN TOTALS + COST
========================================================================================================
  input (uncached)              2,332,845
  cache write 5m               33,208,466
  cache write 1h                4,898,188
  cache read (reuse)        1,084,415,252
  output (generated)            1,964,186
  ----
  TOTAL billed tokens       1,126,818,937   (1126.8M)
  cache-read share                  96.2%
  ESTIMATED COST                  $859.51   (list price; excludes discounts)

========================================================================================================
PER-PR (git diffstat + attributed agent cost)
========================================================================================================
PR   title                             +lines  -lines files agents   output     cost
------------------------------------------------------------------------------------
#1   feat: scaffold Go server + Vite/   2,333      18    39      3   94,091   $44.56
#2   feat: add design-system foundati   2,745      12    62      3  105,618   $45.83
#3   feat: add demo Jira-style app sh   1,752      45    22      6  174,780  $100.03
#4   feat: build parody AI-SaaS landi   2,933      59    49      6  203,535  $113.47
#5   feat: add demo Kanban board with   2,030      55    32      7  219,732  $118.87
#6   feat: add demo issue detail view   2,386      28    31      5  155,308   $89.84
#7   feat: add simulated agentic AI f   4,204     114    45      5  268,202  $177.87

PR links seen in transcript: https://github.com/fx/bench-opus-4-8-ultra/pull/1, https://github.com/fx/bench-opus-4-8-ultra/pull/2, https://github.com/fx/bench-opus-4-8-ultra/pull/3, https://github.com/fx/bench-opus-4-8-ultra/pull/4, https://github.com/fx/bench-opus-4-8-ultra/pull/5, https://github.com/fx/bench-opus-4-8-ultra/pull/6, https://github.com/fx/bench-opus-4-8-ultra/pull/7
```
