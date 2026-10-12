"""Summarise the pilot ledgers per model, exposure mode, task and configuration, and as paired differences.

Usage: python3 analyze.py <runs.jsonl,...> <plan.json,...> [judgements.jsonl,...] > summary.md

Two views are printed:
  - "as recorded": every executed run of stages 1 and 2 (the original 90), including runs that may have been affected
    by the shared host /tmp;
  - "corrected": original runs whose pair group was replaced by stage 3 are excluded (reason recorded) and the stage 3
    replacements, run inside the sandbox boundary, take their place.
Paired differences use only pairs in which both runs are valid in the view. Small samples: counts, means and per-pair
differences only; no p-values. Costs are Pi's list-price calculation from the provider model catalog, not invoices.
"""
import json
import re
import statistics
import sys
from collections import defaultdict

runs = [json.loads(line) for file in sys.argv[1].split(",") for line in open(file) if line.strip()]
plans = [json.load(open(file)) for file in sys.argv[2].split(",")]
judgements = [json.loads(line) for file in (sys.argv[3].split(",") if len(sys.argv) > 3 else []) for line in open(file) if line.strip()]
planned = [dict(run, stage=plan.get("stage", "1")) for plan in plans for run in plan["runs"]]
by_id = {run["runId"]: run for run in runs}
replaced = {run["replaces"]: run["runId"] for run in planned if run.get("replaces")}
MAIN_CONFIGS = {"off", "current", "r1", "r2", "r3a", "r3b", "r4"}
BASE = {"r1-profile": "current-profile", "r2-profile": "current-profile", "r3a-profile": "current-profile", "r3b-profile": "current-profile",
        "r4-mfg": "current-mfg", "r4-select": "current-select", "r1": "current", "r2": "current", "r3a": "current", "r3b": "current", "r4": "current"}
EXPOSURE = {"router": r"^skills/wb-", "ponytail": r"vendor/ponytail/", "ecc": r"vendor/ecc/", "verification": r"verification-before-completion",
            "ast-grep/context7": r"vendor/(ast-grep|context7)/", "dmaic": r"/dmaic/"}


def model_of(run):
    model = run["model"]
    return model["id"].split("/")[-1] + ":" + model["thinking"]


def mode_of(config):
    return "select" if "select" in config else "profile" if ("profile" in config or "mfg" in config) else "auto"


def is_error(run):
    return bool(run["killed"]) or run["exitCode"] != 0 or run["stopReason"] not in ("stop", None) or bool(run.get("errorMessage"))


def facts(run):
    b, u, g = run["behaviour"], run["usage"], run["grade"]
    exposure = {k: any(re.search(p, x) for x in run["exposure"]) for k, p in EXPOSURE.items()}
    return {
        "accept": bool(g["checks"].get("acceptance")), "cost": u["costListPrice"], "tokensIn": u["input"] + u["cacheRead"] + u["cacheWrite"],
        "uncachedIn": u["input"], "out": u["output"], "wall": run["wallSeconds"], "tools": b["toolCalls"], "added": g["diff"]["added"],
        "testsAfterEdit": b["ranTestsAfterLastEdit"], "installs": len(b["installAttempts"]), "probes": len(b["toolProbe"]),
        "falseClaim": bool(b["claimsPass"] and not g["checks"].get("acceptance")), "error": is_error(run), "exposure": exposure,
    }


def view(corrected):
    """Planned cells -> list of (planned run, executed run or None, status)."""
    cells = defaultdict(list)
    for plan_run in planned:
        if plan_run["stage"] == "3" and not corrected:
            continue
        executed = by_id.get(plan_run["runId"])
        if executed is None:
            status = "not run"
        elif corrected and plan_run["runId"] in replaced:
            status = "excluded"
        elif is_error(executed):
            status = "error"
        else:
            status = "valid"
        model = plan_run.get("model") or plans[0]["model"]
        key = (model["id"].split("/")[-1] + ":" + model["thinking"], mode_of(plan_run["config"]), plan_run["task"], plan_run["config"])
        cells[key].append((plan_run, executed, status))
    return cells


def mean(values):
    values = list(values)
    return statistics.mean(values) if values else None


def fmt(value, digits=2):
    return "–" if value is None else f"{value:.{digits}f}"


def cell_table(cells, title):
    print(f"\n### {title}\n")
    print("| Model | Mode | Task | Config | Planned | Attempted | Valid | Accepted (of valid) | Excluded | Errors | Mean cost $ | Mean input tok | Mean wall s | Mean tool calls | Tests after last edit | Install attempts | Router read | Ponytail | ECC | Verification | ast-grep/Context7 | DMAIC |")
    print("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    for key in sorted(cells):
        entries = cells[key]
        attempted = [e for e in entries if e[1] is not None]
        valid = [facts(e[1]) for e in entries if e[2] == "valid"]
        n = len(valid)
        ex = lambda k: f"{sum(f['exposure'][k] for f in valid)}/{n}"
        print(f"| {' | '.join(key)} | {len(entries)} | {len(attempted)} | {n} | {sum(f['accept'] for f in valid)}/{n} | {sum(e[2] == 'excluded' for e in entries)} | {sum(e[2] == 'error' for e in entries)} | "
              f"{fmt(mean(f['cost'] for f in valid), 3)} | {fmt(mean(f['tokensIn'] for f in valid), 0)} | {fmt(mean(f['wall'] for f in valid), 0)} | {fmt(mean(f['tools'] for f in valid), 1)} | "
              f"{sum(f['testsAfterEdit'] for f in valid)}/{n} | {sum(f['installs'] for f in valid)} | {ex('router')} | {ex('ponytail')} | {ex('ecc')} | {ex('verification')} | {ex('ast-grep/context7')} | {ex('dmaic')} |")


def pair_table(cells, title):
    print(f"\n### {title}\n")
    print("| Model | Mode | Task | Comparison | Valid pairs | Accept (variant vs baseline) | Δ cost $ per pair | Δ input tok per pair | Δ wall s per pair | Δ tool calls per pair |")
    print("|---|---|---|---|---|---|---|---|---|---|")
    for (model, mode, task, config) in sorted(cells):
        base_config = "off" if config == "current" else BASE.get(config)
        if not base_config or (model, mode if config != "current" else "auto", task, base_config) not in cells:
            continue
        base_key = (model, "auto", task, "off") if config == "current" else (model, mode, task, base_config)
        variant = {e[0]["rep"]: facts(e[1]) for e in cells[(model, mode, task, config)] if e[2] == "valid"}
        base = {e[0]["rep"]: facts(e[1]) for e in cells[base_key] if e[2] == "valid"}
        reps = sorted(set(variant) & set(base))
        d = lambda k, digits=0: ", ".join(f"{variant[r][k] - base[r][k]:+.{digits}f}" for r in reps) or "–"
        print(f"| {model} | {mode} | {task} | {config} − {base_config} | {len(reps)} | {sum(variant[r]['accept'] for r in reps)}/{len(reps)} vs {sum(base[r]['accept'] for r in reps)}/{len(reps)} | "
              f"{d('cost', 3)} | {d('tokensIn')} | {d('wall')} | {d('tools')} |")


executed_original = [r for r in runs if not r["runId"].startswith("S3-")]
executed_s3 = [r for r in runs if r["runId"].startswith("S3-")]
model_cost = sum(r["usage"]["costListPrice"] for r in runs)
print("# Policy pilot results\n")
print("Costs are Pi list-price calculations from the provider model catalog (not invoices).\n")
print(f"- Original runs (stages 1–2): planned {sum(1 for p in planned if p['stage'] != '3')}, executed {len(executed_original)}, "
      f"accepted {sum(1 for r in executed_original if r['grade']['checks'].get('acceptance'))}, errors/aborts {sum(1 for r in executed_original if is_error(r))}; "
      f"list price ${sum(r['usage']['costListPrice'] for r in executed_original):.2f}.")
print(f"- Stage 3 replacements in the sandbox boundary: planned {sum(1 for p in planned if p['stage'] == '3')}, executed {len(executed_s3)}, "
      f"accepted {sum(1 for r in executed_s3 if r['grade']['checks'].get('acceptance'))}, errors/aborts {sum(1 for r in executed_s3 if is_error(r))}; "
      f"list price ${sum(r['usage']['costListPrice'] for r in executed_s3):.2f}.")
print(f"- Original runs excluded in the corrected view (pair group replaced): {sum(1 for r in executed_original if r['runId'] in replaced)}.")
print(f"- Model runs total: ${model_cost:.2f}; blinded T4 rubric judging: ${sum(j.get('costListPrice') or 0 for j in judgements):.2f} ({len(judgements)} judgements).")
print(f"- Total wall time (sum over runs): {sum(r['wallSeconds'] for r in runs) / 60:.1f} min.")

if judgements:
    scored = {j["runId"]: j["scores"] for j in judgements if j.get("scores")}
    items = ["confound", "no_causal_claim", "discriminating_next_step", "observed_vs_model", "measurement_system"]
    print("\n## Blinded T4 rubric (gpt-6.1-sol, labels hidden)\n")
    print("| Run | " + " | ".join(items) + " |")
    print("|---|" + "---|" * len(items))
    for run_id in sorted(scored):
        print(f"| {run_id} | " + " | ".join(str(scored[run_id].get(i)) for i in items) + " |")

for corrected, name in ((False, "As recorded (original 90 runs, shared /tmp not excluded)"), (True, "Corrected (replaced pair groups excluded, stage 3 sandbox runs included)")):
    cells = view(corrected)
    print(f"\n## {name}")
    cell_table(cells, "Per model, mode, task and configuration (exposure = runs that opened the file / valid runs)")
    pair_table(cells, "Paired differences (variant − baseline; same model, mode, task and repetition; both runs valid). `current − off` is the package effect")

print("\n## Workbench files read per run\n")
print("| Run | Files |")
print("|---|---|")
for run in sorted(runs, key=lambda r: r["runId"]):
    if run["config"] != "off":
        print(f"| {run['runId']}{' (excluded in corrected view)' if run['runId'] in replaced else ''} | {'<br>'.join(sorted(p for p in run['exposure'] if p.endswith('.md'))) or '(none)'} |")

print("\n## Failed checks, aborts and notable behaviour\n")
for run in sorted(runs, key=lambda r: r["runId"]):
    f = facts(run)
    notes = []
    failed = [k for k, v in run["grade"]["checks"].items() if v is False]
    if failed:
        notes.append("failed: " + "; ".join(failed))
    if f["error"]:
        notes.append(f"error/abort: exit={run['exitCode']} killed={run['killed']} stop={run['stopReason']} error={run.get('errorMessage')}")
    if run["behaviour"]["installAttempts"]:
        notes.append("install attempts: " + " || ".join(c[:120] for c in run["behaviour"]["installAttempts"]))
    if run["behaviour"]["toolProbe"]:
        notes.append("tool probes: " + " || ".join(c[:120] for c in run["behaviour"]["toolProbe"]))
    if f["falseClaim"]:
        notes.append("claims success while acceptance failed")
    if notes:
        print(f"- **{run['runId']}**: " + " / ".join(notes))
