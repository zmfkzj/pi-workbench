"""Generate the task C data (deterministic). Usage: python3 generate.py <repo dir>

Design targets, chosen before any model run: gauge R&R with %study variation between 27 and 29.9 % (below the 30 %
limit) but ndc = 4 (< 5), no operator-by-part interaction in the model (pooling decision does not change the
conclusion), %tolerance well below 30 %, and a process that looks capable (Cpk > 1.33) but has one subgroup with a
special-cause mean shift beyond the Xbar control limit. The seed search below stops at the first seed meeting them.
"""
import csv
import importlib.util
import random
import sys
from pathlib import Path

repo = Path(sys.argv[1])
here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("grade", here / "hidden" / "grade.py")
grade = importlib.util.module_from_spec(spec)
spec.loader.exec_module(grade)
LSL, USL = 9.8, 10.2


def write(seed):
    rng = random.Random(seed)
    (repo / "data").mkdir(parents=True, exist_ok=True)
    parts = [round(rng.gauss(10.03, 0.036), 4) for _ in range(10)]
    ops = {"A": 0.0, "B": rng.gauss(0, 0.004), "C": rng.gauss(0, 0.004)}
    with open(repo / "data" / "gauge_study.csv", "w", newline="") as handle:
        w = csv.writer(handle)
        w.writerow(["part", "operator", "trial", "value"])
        for trial in (1, 2, 3):
            for op, bias in ops.items():
                for index, true in enumerate(parts, 1):
                    w.writerow([index, op, trial, f"{true + bias + rng.gauss(0, 0.0105):.4f}"])
    with open(repo / "data" / "process_subgroups.csv", "w", newline="") as handle:
        w = csv.writer(handle)
        w.writerow(["subgroup", "timestamp", "value"])
        for g in range(1, 26):
            shift = 0.085 if g == 17 else 0.0
            for k in range(5):
                hour, minute = 6 + (g - 1) // 2, 30 * ((g - 1) % 2) + 5 * k
                w.writerow([g, f"2026-09-14T{hour:02d}:{minute:02d}", f"{rng.gauss(10.03 + shift, 0.04):.4f}"])
    (repo / "data" / "spec.txt").write_text(f"# Shaft diameter, mm\nLSL = {LSL}\nUSL = {USL}\n")


for seed in range(1, 5000):
    write(seed)
    g = grade.gauge(repo, USL - LSL)
    s = grade.spc(repo, LSL, USL)
    pooled, unpooled = g["pooled"], g["unpooled"]
    if (27 <= pooled["pct_study_var"] <= 29.9 and 27 <= unpooled["pct_study_var"] <= 29.9 and pooled["ndc"] == 4 and unpooled["ndc"] == 4
            and g["p_interaction"] > 0.4 and s["spc"]["out_of_control_subgroups"] == [17] and s["capability"]["cpk"] > 1.4 and s["capability"]["ppk"] > 1.2):
        print(f"seed {seed}: %SV {pooled['pct_study_var']:.2f}/{unpooled['pct_study_var']:.2f}, ndc {pooled['ndc']}, p_int {g['p_interaction']:.3f}, "
              f"%tol {pooled['pct_tolerance']:.1f}, Cpk {s['capability']['cpk']:.3f}, Ppk {s['capability']['ppk']:.3f}")
        break
else:
    raise SystemExit("no seed met the design targets")
