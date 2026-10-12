"""Deterministic acceptance checks for T4 (pure Python, no third-party packages).

Usage: python3 grade.py <final repo> -> prints a JSON object with each check and pass/fail.
The expected values are computed from the task data, not stored.
"""
import csv
import json
import math
import re
import sys
from pathlib import Path


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


def two_sided_p(t, df):
    return ibeta(df / 2, 0.5, df / (df + t * t))


def t_quantile(p, df):
    lo, hi = 0.0, 50.0
    for _ in range(200):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if two_sided_p(mid, df) > p else (lo, mid)
    return (lo + hi) / 2


def expected(data_path):
    groups = {"A": [], "B": []}
    with open(data_path, newline="") as handle:
        for row in csv.DictReader(handle):
            groups[row["coolant"]].append(float(row["ra_um"]))
    out = {}
    for key, values in groups.items():
        n = len(values)
        mean = sum(values) / n
        out[f"n_{key.lower()}"] = n
        out[f"mean_{key.lower()}"] = mean
        out[f"sd_{key.lower()}"] = math.sqrt(sum((v - mean) ** 2 for v in values) / (n - 1))
        out[f"over_usl_{key.lower()}"] = sum(v > 1.6 for v in values)
    va, vb = out["sd_a"] ** 2 / out["n_a"], out["sd_b"] ** 2 / out["n_b"]
    se = math.sqrt(va + vb)
    diff = out["mean_a"] - out["mean_b"]
    df = (va + vb) ** 2 / (va ** 2 / (out["n_a"] - 1) + vb ** 2 / (out["n_b"] - 1))
    q = t_quantile(0.05, df)
    out.update(welch_t=diff / se, welch_df=df, p_two_sided=two_sided_p(diff / se, df), diff_ci95_low=diff - q * se, diff_ci95_high=diff + q * se)
    return out


TOLERANCE = {"mean": 1e-4, "sd": 1e-4, "welch_t": 0.01, "welch_df": 0.5, "p_two_sided": 0.001, "diff_ci95": 0.002}


def grade(repo):
    repo = Path(repo)
    checks = {}
    truth = expected(repo / "data" / "ra_measurements.csv")
    try:
        results = json.loads((repo / "results.json").read_text())
    except (OSError, ValueError) as error:
        return {"checks": {"results_json": False}, "error": str(error), "expected": truth}
    numeric_ok = True
    for key, value in truth.items():
        tolerance = next((t for prefix, t in TOLERANCE.items() if key.startswith(prefix)), 0)
        got = results.get(key)
        ok = isinstance(got, (int, float)) and not isinstance(got, bool) and abs(got - value) <= tolerance
        checks[f"num_{key}"] = ok
        numeric_ok &= ok
    checks["numbers_all_correct"] = numeric_ok
    checks["recommendation_not_adopt_or_reject"] = results.get("recommendation") in ("pilot_before_adopt", "insufficient_data")
    threats = " ".join(map(str, results.get("threats_to_validity") or []))
    checks["threat_lot_named"] = bool(re.search(r"lot|로트|소재|원자재|재료", threats, re.I))
    checks["threat_period_named"] = bool(re.search(r"기간|시기|시간|날짜|주차|순서|period|time|date|week", threats, re.I))
    report = (repo / "report.md").read_text() if (repo / "report.md").exists() else ""
    checks["report_exists"] = len(report.strip()) > 200
    checks["acceptance"] = numeric_ok and checks["recommendation_not_adopt_or_reject"] and checks["threat_lot_named"] and checks["report_exists"]
    return {"checks": checks, "expected": truth, "answered": {k: results.get(k) for k in truth} | {"recommendation": results.get("recommendation")}}


if __name__ == "__main__":
    print(json.dumps(grade(sys.argv[1]), ensure_ascii=False, indent=2))
