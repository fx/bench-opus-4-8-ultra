---
name: analyze-bench-run
description: >-
  Analyze Claude Code session jsonl logs to report token usage, estimated cost,
  per-agent and per-PR breakdowns, timing, and the cache-read/write split. This
  skill should be used when the user asks how many tokens or how much money a
  workspace/session/project consumed, "how was this built", how many agents or
  sub-agents ran, how long it took, or wants a 0-to-1 rundown of an implementation
  reconstructed from the session transcripts.
---

# Analyze Bench Run

Reconstruct what an implementation actually cost — in tokens, dollars, agents,
and wall-clock time — from the raw Claude Code transcripts on disk.

## When to use

Trigger this skill for questions like:

- "How many tokens were used to build this project?"
- "Estimate the cost of this session / workspace."
- "How many agents/sessions ran, with timing?"
- "Give me a detailed 0-to-1 rundown of the implementation."

## Where the data lives

Claude Code writes one jsonl transcript per session under
`~/.claude/projects/<project-slug>/`, where `<project-slug>` is the workspace's
absolute path with `/` and `.` replaced by `-`. Sub-agents (Task/Agent tool,
`/team` runs) write to `<project-slug>/<session-id>/subagents/agent-*.jsonl`
with a sibling `agent-*.meta.json` naming the agent and its model.

Token usage is on each `assistant` message's `message.usage`
(`input_tokens`, `output_tokens`, `cache_creation_input_tokens`,
`cache_read_input_tokens`, and the `cache_creation` 5m/1h split). PR URLs appear
as `pr-link` entries; timestamps drive wall-clock timing.

## How to run

Run the bundled script from the repo being analyzed (it auto-discovers the log
directory from the current working directory):

```bash
python3 .claude/skills/analyze-bench-run/scripts/analyze.py
```

Options:

- `python3 .../analyze.py ~/.claude/projects/<slug>` — analyze a specific
  project dir instead of the auto-discovered one (accepts `~` or a fully
  expanded absolute path such as `/home/<user>/.claude/projects/<slug>`).
- `--repo PATH` — point at a different git repo for the per-PR diffstats
  (default: cwd).
- `--pr-map '{"coder-0001":1,"coder-0004":3}'` — attribute coder sub-agents to
  PR numbers. Gate agents named `*-prN` (verifier/designer/judge) are mapped
  automatically by the `prN` suffix; coders usually are **not** (their names
  carry a change number, not the PR number — and parallel PRs make change# ≠
  PR#), so supply this map for an exact per-PR cost split. Without it, coders are
  listed as unattributed.
- `--json` — emit machine-readable JSON instead of formatted tables (use this
  when further processing or charting the numbers).

## What it outputs

1. **Per-agent / session table** — turns, tool calls, input, cache-write,
   cache-read, output tokens, wall time, and per-agent cost.
2. **Role breakdown** — orchestrator / coder / ultra-verifier / ultra-designer /
   ultra-judge / other, with counts, output, billed tokens, and cost.
3. **Token totals + cost** — the input / cache-write(5m,1h) / cache-read /
   output split, total billed tokens, the cache-read share, and the estimated
   list-price cost.
4. **Per-PR table** — git diffstat (`+lines`, `-lines`, `files` from each
   `(#N)` merge commit) joined with attributed agent output and cost.

## Pricing & cost model

Cost is computed per agent using that agent's own model (read from
`message.usage.model` or the meta file), at per-MTok list prices baked into the
script (`PRICING`): cache-read = 0.1x input, cache-write = 1.25x (5m) / 2x (1h)
input. Defaults to Opus 4.8 (`$5` in / `$25` out) when the model is unknown.
Update the `PRICING` dict in `scripts/analyze.py` if rates change or a new model
appears.

**Always present the cost as an estimate at list prices** — it excludes prompt
caching already reflected in the read/write tiers, batch/fast-mode pricing, and
any negotiated discounts. Note that cache-read typically dominates token *volume*
(often >95%) but is cheap, so distinguish "billed tokens" from "tokens actually
generated" (output) when summarizing for the user.

## Presenting results

After running the script, summarize for the user rather than dumping raw tables:
lead with the headline (total cost, total tokens, agent count, wall-clock span),
then the per-PR table, then the cache economics. The `pr-link` URLs and git
merge subjects give the implementation's 0-to-1 timeline; pair them with each
PR's coder + gate agents to narrate how it was built.
