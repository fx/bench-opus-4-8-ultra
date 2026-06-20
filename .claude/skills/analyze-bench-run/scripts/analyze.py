#!/usr/bin/env python3
"""Analyze Claude Code session jsonl logs: tokens, cost, agents, timing, per-PR.

Parses a workspace's session transcript(s) plus its sub-agent logs under
~/.claude/projects/<project-dir>/ and prints:
  - per-agent / session table (turns, tools, tokens, wall time)
  - role breakdown (orchestrator / coder / verifier / designer / judge / other)
  - token totals (input / cache-write 5m+1h / cache-read / output)
  - cost estimate at per-model list prices
  - per-PR git diffstat table, with best-effort token/cost attribution

Cost is a list-price ESTIMATE; it ignores batch/fast-mode/discount adjustments.

Usage:
  python3 analyze.py [PROJECT_DIR] [--repo PATH] [--pr-map JSON] [--json]

  PROJECT_DIR  Path to ~/.claude/projects/<slug> (default: derived from --repo
               or the current working directory).
  --repo PATH  Git repo to pull per-PR diffstats from (default: cwd).
  --pr-map     JSON object mapping agent name -> PR number to attribute coders
               precisely, e.g. '{"coder-0001":1,"coder-0004":3}'.
  --json       Emit machine-readable JSON instead of formatted tables.
"""
import argparse, datetime, glob, json, os, re, subprocess, sys
from collections import defaultdict

# Per-MTok list prices: (input, output). Cache read = 0.1x input,
# cache write 5m = 1.25x input, 1h = 2x input. Source: claude-api skill.
PRICING = {
    "claude-fable-5":    (10.0, 50.0),
    "claude-mythos-5":   (10.0, 50.0),
    "claude-opus-4-8":   (5.0, 25.0),
    "claude-opus-4-7":   (5.0, 25.0),
    "claude-opus-4-6":   (5.0, 25.0),
    "claude-opus-4-5":   (5.0, 25.0),
    "claude-sonnet-4-6": (3.0, 15.0),
    "claude-sonnet-4-5": (3.0, 15.0),
    "claude-haiku-4-5":  (1.0, 5.0),
}
DEFAULT_MODEL = "claude-opus-4-8"


def price_for(model):
    if not model:
        return PRICING[DEFAULT_MODEL]
    m = model.split("[")[0]  # strip context-window suffix like [1m]
    return PRICING.get(m, PRICING[DEFAULT_MODEL])


def model_cost(model, inp, outp, cc5, cc1, cr):
    pin, pout = price_for(model)
    return (inp * pin + outp * pout + cr * (pin * 0.1)
            + cc5 * (pin * 1.25) + cc1 * (pin * 2.0)) / 1e6


def parse_ts(s):
    if not s or not isinstance(s, str):
        return None
    try:
        dt = datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None
    # Normalize naive timestamps to UTC so all datetimes are comparable
    # (mixing naive and aware datetimes raises TypeError when sorting).
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt


def hm(seconds):
    s = int(seconds)
    h, m, sec = s // 3600, (s % 3600) // 60, s % 60
    return f"{h}h{m:02d}m" if h else f"{m}m{sec:02d}s"


def analyze_log(path, model_hint=None):
    a = dict(inp=0, outp=0, cc5=0, cc1=0, cr=0, turns=0, tools=0,
             first=None, last=None, model=model_hint, prlinks=set())
    for line in open(path, errors="replace"):
        try:
            d = json.loads(line)
        except (json.JSONDecodeError, ValueError):
            continue
        ts = parse_ts(d.get("timestamp"))
        if ts:
            a["first"] = ts if not a["first"] or ts < a["first"] else a["first"]
            a["last"] = ts if not a["last"] or ts > a["last"] else a["last"]
        t = d.get("type")
        if t == "pr-link":
            url = d.get("url") or d.get("prUrl")
            if url:
                a["prlinks"].add(url)
        if t != "assistant":
            continue
        msg = d.get("message", {})
        u = msg.get("usage")
        if u:
            a["inp"] += u.get("input_tokens", 0)
            a["outp"] += u.get("output_tokens", 0)
            a["cr"] += u.get("cache_read_input_tokens", 0)
            ccd = u.get("cache_creation") or {}
            a["cc5"] += ccd.get("ephemeral_5m_input_tokens", 0)
            a["cc1"] += ccd.get("ephemeral_1h_input_tokens", 0)
            # any cache-create not split into 5m/1h -> treat as 5m
            split = ccd.get("ephemeral_5m_input_tokens", 0) + ccd.get("ephemeral_1h_input_tokens", 0)
            a["cc5"] += max(0, u.get("cache_creation_input_tokens", 0) - split)
            a["turns"] += 1
            # Model may live on the message or inside usage; prefer message,
            # fall back to usage, then keep any prior/meta-supplied value.
            a["model"] = msg.get("model") or u.get("model") or a["model"]
        for blk in (msg.get("content") or []):
            if isinstance(blk, dict) and blk.get("type") == "tool_use":
                a["tools"] += 1
    return a


def role_of(name):
    n = name.lower()
    if n.startswith("main"):
        return "orchestrator"
    if "coder" in n:
        return "coder"
    if "verif" in n:
        return "ultra-verifier"
    if "design" in n:
        return "ultra-designer"
    if "judge" in n:
        return "ultra-judge"
    return "other"


def pr_of(name, pr_map):
    if name in pr_map:
        return pr_map[name]
    m = re.search(r"pr[-_]?(\d+)", name.lower())
    return int(m.group(1)) if m else None


def discover_project_dir(repo):
    """~/.claude/projects encodes the abs path with / and . replaced by -."""
    base = os.path.expanduser("~/.claude/projects")
    target = os.path.abspath(repo)
    slug = target.replace("/", "-").replace(".", "-")
    cand = os.path.join(base, slug)
    if os.path.isdir(cand):
        return cand
    # fall back to longest-prefix match
    best = None
    for d in glob.glob(os.path.join(base, "*")):
        nm = os.path.basename(d)
        if slug.startswith(nm) and (not best or len(nm) > len(os.path.basename(best))):
            best = d
    return best


def collect_logs(project_dir):
    """Return [(display_name, path, kind, model_hint)]."""
    rows = []
    for f in sorted(glob.glob(os.path.join(project_dir, "*.jsonl"))):
        sid = os.path.basename(f)[:8]
        rows.append((f"main:{sid}", f, "main", None))
    for f in sorted(glob.glob(os.path.join(project_dir, "*", "subagents", "agent-*.jsonl"))):
        meta = f[:-6] + ".meta.json"
        name, model = os.path.basename(f), None
        if os.path.exists(meta):
            try:
                mj = json.load(open(meta))
                name = mj.get("name", name)
                model = mj.get("model")
            except (json.JSONDecodeError, ValueError):
                pass
        rows.append((name, f, "sub", model))
    return rows


def git_pr_diffstats(repo):
    """Map PR number -> (added, removed, files, title) from merge commits '(#N)'."""
    out = {}
    try:
        log = subprocess.check_output(
            ["git", "-C", repo, "log", "--all", "--pretty=%H\t%s"],
            text=True, stderr=subprocess.DEVNULL)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return out
    for line in log.splitlines():
        if "\t" not in line:
            continue
        h, subj = line.split("\t", 1)
        m = re.search(r"\(#(\d+)\)\s*$", subj)
        if not m:
            continue
        n = int(m.group(1))
        # git log is newest->oldest; keep the first (newest) commit for each PR
        # number so reverts/re-merges/backports don't clobber it with an older one.
        if n in out:
            continue
        try:
            ns = subprocess.check_output(
                ["git", "-C", repo, "diff", "--numstat", f"{h}^1", h],
                text=True, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError:
            continue
        add = rem = files = 0
        for r in ns.splitlines():
            parts = r.split("\t")
            if len(parts) == 3:
                files += 1
                if parts[0].isdigit():
                    add += int(parts[0])
                if parts[1].isdigit():
                    rem += int(parts[1])
        title = re.sub(r"\s*\(#\d+\)\s*$", "", subj)
        out[n] = (add, rem, files, title)
    return out


def fmt(n):
    return f"{n:,}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir", nargs="?")
    ap.add_argument("--repo", default=os.getcwd())
    ap.add_argument("--pr-map", default="{}")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    pdir = (os.path.expanduser(args.project_dir) if args.project_dir
            else discover_project_dir(args.repo))
    if not pdir or not os.path.isdir(pdir):
        sys.exit(f"error: could not find session log dir (tried {pdir}). "
                 f"Pass it explicitly or use --repo.")
    try:
        pr_map = json.loads(args.pr_map)
    except (json.JSONDecodeError, ValueError) as e:
        sys.exit(f"error: --pr-map is not valid JSON: {e}")

    rows = collect_logs(pdir)
    if not rows:
        sys.exit(f"error: no .jsonl logs under {pdir}")

    agents = []
    for name, path, kind, model_hint in rows:
        a = analyze_log(path, model_hint)
        a.update(name=name, kind=kind)
        a["cost"] = model_cost(a["model"], a["inp"], a["outp"], a["cc5"], a["cc1"], a["cr"])
        a["billed"] = a["inp"] + a["outp"] + a["cc5"] + a["cc1"] + a["cr"]
        a["wall"] = (a["last"] - a["first"]).total_seconds() if a["first"] and a["last"] else 0
        agents.append(a)

    diffs = git_pr_diffstats(args.repo)
    pr_links = sorted({u for a in agents for u in a["prlinks"]})

    if args.json:
        out = {"project_dir": pdir, "pr_links": pr_links,
               "agents": [{k: (v if not isinstance(v, (set, datetime.datetime)) else
                              (sorted(v) if isinstance(v, set) else v.isoformat()))
                           for k, v in a.items()} for a in agents],
               "pr_diffstats": {str(k): v for k, v in diffs.items()}}
        print(json.dumps(out, indent=2, default=str))
        return

    # ---- per-agent table ----
    agents.sort(key=lambda x: (x["kind"] != "main",
                               x["first"] or datetime.datetime.max.replace(
                                   tzinfo=datetime.timezone.utc)))
    print("=" * 104)
    print(f"PER-AGENT / SESSION BREAKDOWN   ({pdir})")
    print("=" * 104)
    hdr = (f"{'agent/session':<30} {'turns':>6} {'tools':>6} {'input':>11}"
           f" {'cache_wr':>11} {'cache_rd':>14} {'output':>10} {'wall':>8} {'cost':>9}")
    print(hdr + "\n" + "-" * len(hdr))
    tot = defaultdict(int)
    tcost = 0.0
    for a in agents:
        print(f"{a['name'][:30]:<30} {a['turns']:>6} {a['tools']:>6}"
              f" {fmt(a['inp']):>11} {fmt(a['cc5'] + a['cc1']):>11} {fmt(a['cr']):>14}"
              f" {fmt(a['outp']):>10} {hm(a['wall']):>8} {'$' + format(a['cost'], '.2f'):>9}")
        for k in ("inp", "outp", "cc5", "cc1", "cr", "turns", "tools"):
            tot[k] += a[k]
        tcost += a["cost"]
    print("-" * len(hdr))
    print(f"{'TOTAL (' + str(len(agents)) + ' logs)':<30} {tot['turns']:>6} {tot['tools']:>6}"
          f" {fmt(tot['inp']):>11} {fmt(tot['cc5'] + tot['cc1']):>11} {fmt(tot['cr']):>14}"
          f" {fmt(tot['outp']):>10} {'':>8} {'$' + format(tcost, '.2f'):>9}")

    # ---- role breakdown ----
    print("\n" + "=" * 104 + "\nBY ROLE\n" + "=" * 104)
    roles = defaultdict(lambda: dict(n=0, turns=0, outp=0, billed=0, cost=0.0))
    for a in agents:
        r = roles[role_of(a["name"])]
        r["n"] += 1
        for k in ("turns", "outp", "billed"):
            r[k] += a[k]
        r["cost"] += a["cost"]
    print(f"{'role':<18} {'#':>4} {'turns':>8} {'output':>11} {'billed':>15} {'cost':>10}")
    for rn in ("orchestrator", "coder", "ultra-verifier", "ultra-designer", "ultra-judge", "other"):
        if rn in roles:
            r = roles[rn]
            print(f"{rn:<18} {r['n']:>4} {r['turns']:>8} {r['outp']:>11,}"
                  f" {r['billed']:>15,} {'$' + format(r['cost'], '.2f'):>10}")

    # ---- token + cost totals ----
    billed = tot["inp"] + tot["cc5"] + tot["cc1"] + tot["cr"] + tot["outp"]
    print("\n" + "=" * 104 + "\nTOKEN TOTALS + COST\n" + "=" * 104)
    print(f"  input (uncached)       {fmt(tot['inp']):>16}")
    print(f"  cache write 5m         {fmt(tot['cc5']):>16}")
    print(f"  cache write 1h         {fmt(tot['cc1']):>16}")
    print(f"  cache read (reuse)     {fmt(tot['cr']):>16}")
    print(f"  output (generated)     {fmt(tot['outp']):>16}")
    print(f"  ----")
    print(f"  TOTAL billed tokens    {fmt(billed):>16}   ({billed/1e6:.1f}M)")
    if billed:
        print(f"  cache-read share       {100*tot['cr']/billed:>15.1f}%")
    print(f"  ESTIMATED COST         {'$' + format(tcost, '.2f'):>16}   (list price; excludes discounts)")

    # ---- per-PR ----
    if diffs:
        print("\n" + "=" * 104 + "\nPER-PR (git diffstat + attributed agent cost)\n" + "=" * 104)
        per = defaultdict(lambda: dict(out=0, billed=0, cost=0.0, agents=0))
        unattributed = []
        for a in agents:
            if a["kind"] != "sub":
                continue
            p = pr_of(a["name"], pr_map)
            if p is None:
                unattributed.append(a["name"])
                continue
            per[p]["out"] += a["outp"]
            per[p]["billed"] += a["billed"]
            per[p]["cost"] += a["cost"]
            per[p]["agents"] += 1
        h2 = (f"{'PR':<5} {'title':<32} {'+lines':>8} {'-lines':>8} {'files':>6}"
              f" {'agents':>7} {'output':>9} {'cost':>9}")
        print(h2 + "\n" + "-" * len(h2))
        for n in sorted(diffs):
            add, rem, files, title = diffs[n]
            d = per.get(n, dict(out=0, billed=0, cost=0.0, agents=0))
            print(f"#{n:<4} {title[:32]:<32} {add:>8,} {rem:>8,} {files:>6}"
                  f" {d['agents']:>7} {d['out']:>9,} {'$' + format(d['cost'], '.2f'):>9}")
        if unattributed:
            print(f"\n  note: {len(unattributed)} sub-agent(s) had no 'prN' in their name and "
                  f"were not attributed to a PR: {', '.join(sorted(set(unattributed)))}")
            print(f"        pass --pr-map '{{\"coder-0001\":1,...}}' to attribute them.")
    if pr_links:
        print(f"\nPR links seen in transcript: {', '.join(pr_links)}")


if __name__ == "__main__":
    main()
