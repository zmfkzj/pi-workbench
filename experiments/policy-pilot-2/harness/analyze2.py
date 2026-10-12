"""Summarise the follow-up pilot. Usage: python3 analyze2.py <runs.jsonl,...> <plan.json,...> > summary.md

Per model, task and configuration: planned/attempted/valid/accepted/errors/timeouts/caps and the pre-registered
discriminating metrics (PLAN.md, "주 판별 지표"); exposure (files opened, text attached); paired comparisons per
recommendation (same model, task and repetition; both runs valid). Three repetitions: counts and per-pair
differences only, no p-values. Costs are Pi list-price calculations, not invoices.
"""
import json
import re
import statistics
import sys
from collections import defaultdict

runs = [json.loads(line) for file in sys.argv[1].split(",") for line in open(file) if line.strip()]
plans = [json.load(open(file)) for file in sys.argv[2].split(",")]
by_id = {r["runId"]: r for r in runs}
planned = [dict(run, stage=plan["stage"]) for plan in plans for run in plan["runs"]]

FILES = {
    "ponytail": r"vendor/ponytail/skills/ponytail/SKILL\.md",
    "search-first": r"vendor/ecc/skills/search-first/SKILL\.md",
    "verification": r"verification-before-completion/SKILL\.md",
    "ast-grep skill": r"vendor/ast-grep/",
    "dmaic SKILL": r"dmaic/SKILL\.md",
    "dmaic phase-2": r"dmaic/references/phase-2-measure\.md",
    "dmaic stat-tools": r"dmaic/references/statistical-tools\.md",
    "router": r"^skills/wb-",
    "WORKFLOWS": r"docs/WORKFLOWS",
}
COMPARISONS = [
    ("R1", "A-ledger-min-amount", "sel-pe", "current", "Ponytail+ECC text attached vs none (auto)"),
    ("R1", "D-probe-retries", "sel-pe", "current", "Ponytail+ECC text attached vs none (auto)"),
    ("R1", "A-ledger-min-amount", "r1-prof", "cur-prof", "coding profile without vs with default Ponytail/ECC wording"),
    ("R1", "D-probe-retries", "r1-prof", "cur-prof", "coding profile without vs with default Ponytail/ECC wording"),
    ("R2", "A-ledger-min-amount", "sel-prin", "sel-ver", "principle attached vs Verification text attached"),
    ("R2", "D-probe-retries", "sel-prin", "sel-ver", "principle attached vs Verification text attached"),
    ("R2", "A-ledger-min-amount", "sel-ver", "current", "Verification text attached vs none"),
    ("R2", "D-probe-retries", "sel-ver", "current", "Verification text attached vs none"),
    ("R2", "A-ledger-min-amount", "r2-prof", "cur-prof", "coding profile without vs with Verification listed"),
    ("R2", "D-probe-retries", "r2-prof", "cur-prof", "coding profile without vs with Verification listed"),
    ("R3", "B-logger-migration", "r3a", "current", "manual-only vs current (auto)"),
    ("R3", "B-logger-migration", "r3b", "current", "conditional vs current (auto)"),
    ("R3", "B-logger-migration", "r3a-prof", "cur-prof", "manual-only vs current (coding profile)"),
    ("R3", "B-logger-migration", "r3b-prof", "cur-prof", "conditional vs current (coding profile)"),
    ("R4", "C-msa-capability", "r4-sel-dmaic", "sel-dmaic", "split vs single DMAIC, text attached"),
    ("R4", "C-msa-capability", "r4-mfg", "cur-mfg", "split vs single DMAIC, manufacturing profile"),
    ("R4", "C-msa-capability", "sel-dmaic", "off", "DMAIC text attached vs no Workbench"),
    ("pkg", "A-ledger-min-amount", "current", "off", "package (auto) vs none"),
    ("pkg", "B-logger-migration", "current", "off", "package (auto) vs none"),
    ("pkg", "C-msa-capability", "current", "off", "package (auto) vs none"),
    ("pkg", "D-probe-retries", "current", "off", "package (auto) vs none"),
]


def model_of(run):
    return run["model"]["id"].split("/")[-1]


def status(run):
    if run is None:
        return "not run"
    if run.get("harnessError"):
        return "error"
    if run.get("killed") == "timeout":
        return "timeout"
    if run.get("killed") in ("cost-cap", "tool-cap"):
        return "cap"
    if run["exitCode"] != 0 or run["stopReason"] not in ("stop", None) or run.get("errorMessage"):
        return "error"
    return "valid"


def added_lines(diff, path_re):
    out, current = [], None
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            current = line[6:]
        elif line.startswith("+") and not line.startswith("+++") and current and re.search(path_re, current):
            out.append(line[1:])
    return out


def metrics(run):
    b, g = run["behaviour"], run["grade"]
    opened = list(run["exposure"]["opened"])
    m = {
        "accept": bool(g["checks"].get("acceptance")),
        "cost": run["usage"]["costListPrice"],
        "inTok": run["usage"]["input"] + run["usage"]["cacheRead"] + run["usage"]["cacheWrite"],
        "outTok": run["usage"]["output"],
        "wall": run["wallSeconds"],
        "tools": b["toolCalls"],
        "added": g["diff"]["added"],
        "deleted": g["diff"]["deleted"],
        "outside": len(g["diff"]["outsideAllowed"]),
        "falseClaim": bool(b["claimsSuccess"] and not g["checks"].get("acceptance")),
        "installs": len(b["installAttempts"]),
        "astGrep": b["astGrepCalls"],
        "astGrepOk": b["astGrepSucceeded"],
        **{f"open:{k}": any(re.search(p, f) for f in opened) for k, p in FILES.items()},
        "injected": ",".join(i["id"] for i in run["exposure"]["injected"]),
    }
    for name, v in b["verify"].items():
        m[f"verify:{name}"] = bool(v["afterLastEdit"] and v["lastSucceeded"])
    if run["task"].startswith("A"):
        code = added_lines(g["diff"].get("text", ""), r"^(bin/|src/(api|export|read)\.js)")
        m["reuseParseAmount"] = any("parseAmount" in l for l in code)
        m["ownParser"] = any(re.search(r"parseFloat|Number\([^)]*replace|\.replace\([^)]*[,.]", l) for l in code)
    if run["task"].startswith("B"):
        # Separate availability probes (which/--version) from searches or rewrites with ast-grep.
        commands = [str(t["args"].get("command", "")) for t in run["toolLog"] if t["name"] == "bash"]
        m["astProbe"] = any(re.search(r"\bwhich\b[^\n;|&]*\b(ast-grep|sg)\b|\b(ast-grep|sg) (--version|-V)\b", c) for c in commands)
        m["astUse"] = any(re.search(r"\b(ast-grep|sg) (run|scan|-p|--pattern|-r|--rewrite)\b", c) for c in commands)
    if run["task"].startswith("C"):
        m["msStrict"] = bool(g["checks"].get("ms_judgment_strict"))
    return m


def mean(values):
    values = [v for v in values if v is not None]
    return statistics.mean(values) if values else None


def fmt(value, digits=2):
    if value is None:
        return "–"
    return f"{value:.{digits}f}"


cells = defaultdict(list)
for p in planned:
    model = p["model"]["id"].split("/")[-1]
    cells[(p["stage"], model, p["task"], p["config"])].append((p, by_id.get(p["runId"])))

stages = sorted({p["stage"] for p in planned})
print("# Follow-up pilot results\n")
print("Costs are Pi list-price calculations (not invoices). Calibration runs are reported separately and are not part of these tables.\n")
for stage in stages:
    entries = [(p, r) for (s, *_), cell in cells.items() if s == stage for p, r in cell]
    st = [status(r) for _, r in entries]
    valid = [r for (_, r), s in zip(entries, st) if s == "valid"]
    print(f"- **{stage}**: planned {len(entries)}, attempted {sum(r is not None for _, r in entries)}, valid {len(valid)}, accepted {sum(1 for r in valid if r['grade']['checks'].get('acceptance'))}, "
          f"errors {st.count('error')}, timeouts {st.count('timeout')}, caps {st.count('cap')}, not run {st.count('not run')}; "
          f"list price ${sum(r['usage']['costListPrice'] for _, r in entries if r):.2f}; over per-run cap {sum(1 for _, r in entries if r and r.get('overCap'))}; "
          f"tokens in {sum(r['usage']['input'] for _, r in entries if r and 'input' in r['usage'])/1e6:.2f}M uncached + {sum(r['usage']['cacheRead'] for _, r in entries if r and 'cacheRead' in r['usage'])/1e6:.2f}M cache read, out {sum(r['usage']['output'] for _, r in entries if r and 'output' in r['usage'])/1e6:.2f}M.")

TASK_COLS = {
    "A-ledger-min-amount": ["added", "deleted", "outside", "reuseParseAmount", "ownParser", "verify:tests", "verify:cliWithOption", "falseClaim"],
    "B-logger-migration": ["astProbe", "astUse", "open:ast-grep skill", "verify:tests", "verify:searchRemaining", "installs"],
    "C-msa-capability": ["msStrict", "open:dmaic SKILL", "open:dmaic phase-2", "open:dmaic stat-tools", "outside", "installs"],
    "D-probe-retries": ["added", "outside", "verify:reportedCommand", "verify:tests", "falseClaim"],
}
COMMON = ["open:router", "open:ponytail", "open:search-first", "open:verification", "open:WORKFLOWS"]

for stage in stages:
    for task, cols in TASK_COLS.items():
        keys = sorted(k for k in cells if k[0] == stage and k[2] == task)
        if not keys:
            continue
        print(f"\n## {stage} · {task}\n")
        head = ["Config", "Planned", "Valid", "Accepted", "Err/TO/Cap", "Cost $", "Input tok", "Wall s", "Tools"] + cols + COMMON + ["Attached"]
        print("| " + " | ".join(head) + " |")
        print("|" + "---|" * len(head))
        for key in keys:
            entries = cells[key]
            valid = [metrics(r) for _, r in entries if status(r) == "valid"]
            n = len(valid)
            bad = [status(r) for _, r in entries if status(r) not in ("valid", "not run")]
            def col(c):
                vals = [v.get(c) for v in valid]
                if all(isinstance(v, bool) or v is None for v in vals):
                    return f"{sum(bool(v) for v in vals)}/{n}"
                return fmt(mean(vals), 1)
            row = [key[3], str(len(entries)), str(n), f"{sum(v['accept'] for v in valid)}/{n}", f"{bad.count('error')}/{bad.count('timeout')}/{bad.count('cap')}",
                   fmt(mean(v["cost"] for v in valid), 3), fmt(mean(v["inTok"] for v in valid), 0), fmt(mean(v["wall"] for v in valid), 0), fmt(mean(v["tools"] for v in valid), 1)]
            row += [col(c) for c in cols] + [col(c) for c in COMMON] + [valid[0]["injected"] if valid else "–"]
            print("| " + " | ".join(row) + " |")

print("\n## Paired comparisons (variant vs baseline; same model, task, repetition; both valid)\n")
print("| Stage | Rec. | Task | Comparison | Pairs | Accept v/b | Key metric v/b | Δ input tok per pair | Δ cost $ per pair | Δ wall s per pair |")
print("|---|---|---|---|---|---|---|---|---|---|")
KEY = {"A-ledger-min-amount": "added", "B-logger-migration": "astUse", "C-msa-capability": "msStrict", "D-probe-retries": "verify:reportedCommand"}
for stage in stages:
    for rec, task, variant, baseline, label in COMPARISONS:
        model_keys = {k[1] for k in cells if k[0] == stage}
        for model in sorted(model_keys):
            v = {p["rep"]: metrics(r) for p, r in cells.get((stage, model, task, variant), []) if status(r) == "valid"}
            b = {p["rep"]: metrics(r) for p, r in cells.get((stage, model, task, baseline), []) if status(r) == "valid"}
            reps = sorted(set(v) & set(b))
            if not reps:
                continue
            k = KEY[task]
            if rec == "R2" and task.startswith("A"):
                k = "verify:cliWithOption"
            key_v = [v[r][k] for r in reps]
            key_b = [b[r][k] for r in reps]
            show = (lambda xs: f"{sum(bool(x) for x in xs)}/{len(xs)}") if isinstance(key_v[0], bool) else (lambda xs: ",".join(str(x) for x in xs))
            delta = lambda key, d=0: ", ".join(f"{v[r][key] - b[r][key]:+.{d}f}" for r in reps)
            print(f"| {stage} | {rec} | {task[0]} | {variant} vs {baseline} ({label}) | {len(reps)} | {sum(v[r]['accept'] for r in reps)}/{sum(b[r]['accept'] for r in reps)} | "
                  f"{k}: {show(key_v)} vs {show(key_b)} | {delta('inTok')} | {delta('cost', 3)} | {delta('wall')} |")

print("\n## Failures, errors and notable behaviour\n")
for p in sorted(planned, key=lambda x: x["runId"]):
    r = by_id.get(p["runId"])
    s = status(r)
    notes = []
    if s != "valid":
        notes.append(f"status {s}" + (f": {r.get('harnessError') or r.get('errorMessage') or r.get('killed') or r.get('stderrTail', '')[-200:]}" if r else ""))
    elif not r["grade"]["checks"].get("acceptance"):
        notes.append("failed: " + "; ".join(k for k, v in r["grade"]["checks"].items() if v is False))
    if r and r.get("behaviour", {}).get("installAttempts"):
        notes.append("install attempts: " + " || ".join(c[:100] for c in r["behaviour"]["installAttempts"]))
    if r and r.get("overCap"):
        notes.append("over the per-run cost cap")
    if notes:
        print(f"- **{p['runId']}**: " + " / ".join(notes))
