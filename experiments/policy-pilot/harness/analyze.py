"""Summarise the pilot ledger (runs.jsonl) per task and configuration and as paired differences against `current`.

Usage: python3 analyze.py <runs.jsonl>[,<runs.jsonl>...] <plan.json>[,<plan.json>...] > summary.md
No third-party packages. Small samples: report counts, means and per-pair differences, never p-values.
"""
import json
import statistics
import sys
from collections import defaultdict

runs = [json.loads(line) for file in sys.argv[1].split(",") for line in open(file) if line.strip()]
plans = [json.load(open(file)) for file in sys.argv[2].split(",")]
planned = {r["runId"] for plan in plans for r in plan["runs"]}
model_of = lambda run: run["model"]["id"].split("/")[-1] + ":" + run["model"]["thinking"]
BASE = {"r1-profile": "current-profile", "r2-profile": "current-profile", "r3a-profile": "current-profile", "r3b-profile": "current-profile",
        "r4-mfg": "current-mfg", "r4-select": "current-select", "r1": "current", "r2": "current", "r3a": "current", "r3b": "current", "r4": "current"}
seen = {r["runId"] for r in runs}


def mean(values):
    values = [v for v in values if v is not None]
    return statistics.mean(values) if values else None


def fmt(value, digits=2):
    if value is None:
        return "–"
    if isinstance(value, bool):
        return "yes" if value else "no"
    return f"{value:.{digits}f}" if isinstance(value, float) else str(value)


def skills_read(run):
    return sorted({p for p in run["exposure"] if p.endswith(".md")})


def row(run):
    b, u, g = run["behaviour"], run["usage"], run["grade"]
    return {
        "accept": g["checks"].get("acceptance"),
        "visible": g.get("visibleTestsPass"),
        "cost": u["costListPrice"],
        "tokensIn": u["input"] + u["cacheRead"] + u["cacheWrite"],
        "tokensOut": u["output"],
        "wall": run["wallSeconds"],
        "tools": b["toolCalls"],
        "added": g["diff"]["added"],
        "testsAfterEdit": b["ranTestsAfterLastEdit"],
        "cliAfterEdit": b["ranCliAfterLastEdit"],
        "installs": len(b["installAttempts"]),
        "probe": len(b["toolProbe"]),
        "wbFiles": len(skills_read(run)),
        "falseClaim": bool(b["claimsPass"] and g["checks"].get("acceptance") is False),
        "aborted": bool(run["killed"]) or run["exitCode"] != 0 or run["stopReason"] not in ("stop", None),
    }


print("# Policy pilot results\n")
print(f"Planned runs: {len(planned)}. Recorded: {len(runs)}. Missing: {sorted(planned - seen) or 'none'}.\n")
print(f"Accepted: {sum(1 for r in runs if r['grade']['checks'].get('acceptance'))}. Not accepted: {sum(1 for r in runs if not r['grade']['checks'].get('acceptance'))}. "
      f"Aborted (timeout, cap, non-zero exit or error stop): {sum(1 for r in runs if row(r)['aborted'])}. Provider retries: {sum(len(r.get('retries') or []) for r in runs)}.\n")
print(f"Total list-price cost: ${sum(r['usage']['costListPrice'] for r in runs):.2f}; total wall time (sum): {sum(r['wallSeconds'] for r in runs) / 60:.1f} min.\n")

by_cell = defaultdict(list)
for run in runs:
    by_cell[(model_of(run), run["task"], run["config"])].append(run)

print("## Per task and configuration (mean over repetitions; accept = passed/runs)\n")
print("| Model | Task | Config | n | Accept | Visible tests | False pass claim | Cost $ | Input tok | Output tok | Wall s | Tool calls | Lines added | Tests after last edit | CLI after last edit | Install attempts | Tool probes | Workbench files read |")
print("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
for (model, task, config), cell in sorted(by_cell.items()):
    rows = [row(r) for r in cell]
    accepted = sum(1 for r in rows if r["accept"])
    print(f"| {model} | {task} | {config} | {len(rows)} | {accepted}/{len(rows)} | {sum(1 for r in rows if r['visible'])}/{sum(1 for r in rows if r['visible'] is not None)} | {sum(r['falseClaim'] for r in rows)} | "
          f"{fmt(mean([r['cost'] for r in rows]), 3)} | {fmt(mean([r['tokensIn'] for r in rows]), 0)} | {fmt(mean([r['tokensOut'] for r in rows]), 0)} | {fmt(mean([r['wall'] for r in rows]), 0)} | "
          f"{fmt(mean([r['tools'] for r in rows]), 1)} | {fmt(mean([r['added'] for r in rows]), 1)} | {sum(r['testsAfterEdit'] for r in rows)}/{len(rows)} | {sum(r['cliAfterEdit'] for r in rows)}/{len(rows)} | "
          f"{sum(r['installs'] for r in rows)} | {sum(r['probe'] for r in rows)} | {fmt(mean([r['wbFiles'] for r in rows]), 1)} |")

print("\n## Paired differences against the matching baseline (same model, task, repetition and exposure mode; variant − baseline)\n")
print("| Model | Task | Variant | Pairs | Accept (variant vs baseline) | Δ cost $ per pair | Δ input tokens per pair | Δ wall s per pair | Δ tool calls per pair | Δ lines added per pair |")
print("|---|---|---|---|---|---|---|---|---|---|")
for (model, task, config), cell in sorted(by_cell.items()):
    base_config = BASE.get(config)
    if not base_config or (model, task, base_config) not in by_cell:
        continue
    base = {r["rep"]: row(r) for r in by_cell[(model, task, base_config)]}
    variant = {r["rep"]: row(r) for r in cell}
    reps = sorted(set(base) & set(variant))
    if not reps:
        continue
    diff = lambda key: ", ".join(f"{variant[k][key] - base[k][key]:+.{3 if key == 'cost' else 0}f}" for k in reps)
    print(f"| {model} | {task} | {config} vs {base_config} | {len(reps)} | {sum(variant[k]['accept'] for k in reps)}/{len(reps)} vs {sum(base[k]['accept'] for k in reps)}/{len(reps)} | {diff('cost')} | {diff('tokensIn')} | {diff('wall')} | {diff('tools')} | {diff('added')} |")

print("\n## Off vs current (package effect on the same tasks)\n")
print("| Model | Task | Pairs | Accept (current vs off) | Δ cost $ per pair (current − off) | Δ input tokens | Δ wall s |")
print("|---|---|---|---|---|---|---|")
for model, task in sorted({(m, t) for m, t, _ in by_cell}):
    if (model, task, "off") not in by_cell or (model, task, "current") not in by_cell:
        continue
    base = {r["rep"]: row(r) for r in by_cell[(model, task, "off")]}
    cur = {r["rep"]: row(r) for r in by_cell[(model, task, "current")]}
    reps = sorted(set(base) & set(cur))
    diff = lambda key: ", ".join(f"{cur[k][key] - base[k][key]:+.{3 if key == 'cost' else 0}f}" for k in reps)
    print(f"| {model} | {task} | {len(reps)} | {sum(cur[k]['accept'] for k in reps)}/{len(reps)} vs {sum(base[k]['accept'] for k in reps)}/{len(reps)} | {diff('cost')} | {diff('tokensIn')} | {diff('wall')} |")

print("\n## Workbench files read per run (exposure)\n")
print("| Run | Files |")
print("|---|---|")
for run in sorted(runs, key=lambda r: (r["task"], r["config"], r["rep"])):
    if run["config"] == "off":
        continue
    print(f"| {run['runId']} | {'<br>'.join(skills_read(run)) or '(none)'} |")

print("\n## Failed checks, aborts and notable behaviour\n")
for run in sorted(runs, key=lambda r: (r["task"], r["config"], r["rep"])):
    r = row(run)
    failed = [k for k, v in run["grade"]["checks"].items() if v is False]
    notes = []
    if failed:
        notes.append("failed: " + "; ".join(failed))
    if r["aborted"]:
        notes.append(f"aborted: exit={run['exitCode']} killed={run['killed']} stop={run['stopReason']} error={run['errorMessage']}")
    if run["behaviour"]["installAttempts"]:
        notes.append("install attempts: " + " || ".join(c[:120] for c in run["behaviour"]["installAttempts"]))
    if run["behaviour"]["toolProbe"]:
        notes.append("tool probes: " + " || ".join(c[:120] for c in run["behaviour"]["toolProbe"]))
    if r["falseClaim"]:
        notes.append("claims success while acceptance failed")
    if notes:
        print(f"- **{run['runId']}**: " + " / ".join(notes))
