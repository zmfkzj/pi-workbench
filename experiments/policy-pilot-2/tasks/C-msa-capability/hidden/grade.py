"""Grade task C (gauge R&R + Xbar-R + capability) from the task data. Pure Python; expected values are computed here.

Usage: python3 grade.py <final repo>  -> JSON with checks, expected values and the answers.
Acceptance: every computed number within tolerance (gauge R&R accepted with or without the interaction term), the
out-of-control subgroups exact, capability_valid false, and a recommendation that addresses the special causes.
The measurement-system judgment (ndc < 5) is scored separately as `ms_judgment_strict` and is not part of acceptance.
"""
import csv
import json
import math
import sys
from pathlib import Path

A2, D4, D2 = 0.577, 2.114, 2.326


def betacf(a, b, x):
    tiny = 1e-300
    c, d = 1.0, 1 - (a + b) * x / (a + 1)
    d = 1 / (d if abs(d) > tiny else tiny)
    h = d
    for m in range(1, 500):
        m2 = 2 * m
        for aa in (m * (b - m) * x / ((a - 1 + m2) * (a + m2)), -(a + m) * (a + b + m) * x / ((a + m2) * (a + 1 + m2))):
            d = 1 + aa * d
            d = 1 / (d if abs(d) > tiny else tiny)
            c = 1 + aa / c
            c = c if abs(c) > tiny else tiny
            h *= d * c
        if abs(d * c - 1) < 1e-15:
            break
    return h


def ibeta(a, b, x):
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    front = math.exp(math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log(1 - x))
    return front * betacf(a, b, x) / a if x < (a + 1) / (a + b + 2) else 1 - front * betacf(b, a, 1 - x) / b


def f_upper(f, d1, d2):
    return ibeta(d2 / 2, d1 / 2, d2 / (d2 + d1 * f))


def spec(repo):
    values = {}
    for line in (repo / "data" / "spec.txt").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            key, value = line.split("=", 1)
            values[key.strip()] = float(value)
    return values["LSL"], values["USL"]


def gauge(repo, tolerance):
    rows = list(csv.DictReader(open(repo / "data" / "gauge_study.csv")))
    parts = sorted({r["part"] for r in rows}, key=int)
    ops = sorted({r["operator"] for r in rows})
    cell = {}
    for r in rows:
        cell.setdefault((r["part"], r["operator"]), []).append(float(r["value"]))
    p, o = len(parts), len(ops)
    reps = len(next(iter(cell.values())))
    grand = sum(float(r["value"]) for r in rows) / len(rows)
    part_mean = {i: sum(sum(cell[(i, j)]) for j in ops) / (o * reps) for i in parts}
    op_mean = {j: sum(sum(cell[(i, j)]) for i in parts) / (p * reps) for j in ops}
    cell_mean = {k: sum(v) / reps for k, v in cell.items()}
    ss_p = o * reps * sum((m - grand) ** 2 for m in part_mean.values())
    ss_o = p * reps * sum((m - grand) ** 2 for m in op_mean.values())
    ss_po = reps * sum((cell_mean[(i, j)] - part_mean[i] - op_mean[j] + grand) ** 2 for i in parts for j in ops)
    ss_e = sum((v - cell_mean[k]) ** 2 for k, vals in cell.items() for v in vals)
    df_p, df_o, df_po, df_e = p - 1, o - 1, (p - 1) * (o - 1), p * o * (reps - 1)
    ms_p, ms_o, ms_po, ms_e = ss_p / df_p, ss_o / df_o, ss_po / df_po, ss_e / df_e
    p_interaction = f_upper(ms_po / ms_e, df_po, df_e)

    def components(pooled):
        if pooled:
            mse = (ss_po + ss_e) / (df_po + df_e)
            rep, op, inter = mse, max(0.0, (ms_o - mse) / (p * reps)), 0.0
            part = max(0.0, (ms_p - mse) / (o * reps))
        else:
            rep, inter = ms_e, max(0.0, (ms_po - ms_e) / reps)
            op, part = max(0.0, (ms_o - ms_po) / (p * reps)), max(0.0, (ms_p - ms_po) / (o * reps))
        grr = math.sqrt(rep + op + inter)
        tv = math.sqrt(rep + op + inter + part)
        pv = math.sqrt(part)
        return {"ev_sd": math.sqrt(rep), "av_sd": math.sqrt(op + inter), "grr_sd": grr, "pv_sd": pv, "tv_sd": tv,
                "pct_study_var": 100 * grr / tv, "pct_tolerance": 100 * 6 * grr / tolerance, "ndc": math.floor(1.41 * pv / grr)}

    return {"pooled": components(True), "unpooled": components(False), "p_interaction": p_interaction}


def spc(repo, lsl, usl):
    rows = list(csv.DictReader(open(repo / "data" / "process_subgroups.csv")))
    groups = {}
    for r in rows:
        groups.setdefault(int(r["subgroup"]), []).append(float(r["value"]))
    order = sorted(groups)
    means = [sum(groups[g]) / len(groups[g]) for g in order]
    ranges = [max(groups[g]) - min(groups[g]) for g in order]
    xbb, rbar = sum(means) / len(means), sum(ranges) / len(ranges)
    ucl, lcl, uclr = xbb + A2 * rbar, xbb - A2 * rbar, D4 * rbar
    ooc = [g for g, m, r in zip(order, means, ranges) if m > ucl or m < lcl or r > uclr]
    values = [v for g in order for v in groups[g]]
    mean = sum(values) / len(values)
    s = math.sqrt(sum((v - mean) ** 2 for v in values) / (len(values) - 1))
    sw = rbar / D2
    return {
        "spc": {"xbarbar": xbb, "rbar": rbar, "ucl_x": ucl, "lcl_x": lcl, "ucl_r": uclr, "out_of_control_subgroups": ooc},
        "capability": {"sigma_within": sw, "sigma_overall": s, "cp": (usl - lsl) / (6 * sw), "cpk": min(usl - xbb, xbb - lsl) / (3 * sw),
                       "pp": (usl - lsl) / (6 * s), "ppk": min(usl - mean, mean - lsl) / (3 * s)},
    }


def close(got, want, rel=0.01, abs_tol=0.0):
    return isinstance(got, (int, float)) and not isinstance(got, bool) and abs(got - want) <= max(abs_tol, rel * abs(want))


def grade(repo):
    repo = Path(repo)
    lsl, usl = spec(repo)
    truth = {"gauge": gauge(repo, usl - lsl), **spc(repo, lsl, usl)}
    checks = {}
    try:
        answer = json.loads((repo / "results.json").read_text())
    except (OSError, ValueError) as error:
        return {"checks": {"results_json": False, "acceptance": False}, "error": str(error), "expected": truth}
    g = answer.get("grr") or {}
    for variant in ("pooled", "unpooled"):
        want = truth["gauge"][variant]
        checks[f"grr_{variant}"] = all(
            (g.get(k) == want[k]) if k == "ndc" else close(g.get(k), want[k], rel=0.01, abs_tol=0.3 if k.startswith("pct") else 0)
            for k in want)
    checks["grr_numbers"] = checks.pop("grr_pooled") or checks.pop("grr_unpooled")
    checks.pop("grr_unpooled", None)
    s = answer.get("spc") or {}
    checks["spc_limits"] = all(close(s.get(k), truth["spc"][k], rel=0, abs_tol=2e-4) for k in ("xbarbar", "rbar", "ucl_x", "lcl_x", "ucl_r"))
    checks["out_of_control_subgroups"] = sorted(s.get("out_of_control_subgroups") or []) == truth["spc"]["out_of_control_subgroups"]
    c = answer.get("capability") or {}
    checks["capability_numbers"] = all(close(c.get(k), truth["capability"][k], rel=0.01) for k in truth["capability"])
    checks["capability_valid_false"] = answer.get("capability_valid") is False
    checks["recommendation_addresses_special_causes"] = answer.get("recommendation") in ("address_special_causes_first", "improve_measurement_system_and_address_special_causes")
    checks["report_exists"] = (repo / "report.md").exists() and len((repo / "report.md").read_text().strip()) > 300
    checks["acceptance"] = all(checks[k] for k in ("grr_numbers", "spc_limits", "out_of_control_subgroups", "capability_numbers", "capability_valid_false", "recommendation_addresses_special_causes", "report_exists"))
    # Scored separately (not acceptance): ndc < 5 means the gauge cannot support a capability study (AIAG MSA).
    checks["ms_judgment_strict"] = answer.get("ms_adequate_for_capability") is False and answer.get("recommendation") == "improve_measurement_system_and_address_special_causes"
    return {"checks": checks, "expected": truth, "answered": answer}


if __name__ == "__main__":
    print(json.dumps(grade(sys.argv[1]), ensure_ascii=False, indent=1, default=str))
