#!/usr/bin/env python3
# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
# Modified by pi-workbench: purely numeric file names no longer form one empty filename group,
# filename-stem overlap is reported as a suspicion separate from image evidence, and verified
# groups can be supplied with --groups. Upstream original and patch: see the pi-workbench
# patches/tao/ directory and THIRD_PARTY_NOTICES.md.
"""
Detect near-duplicate images across dataset splits.

Near-duplicates across train/val/test are the single biggest source of inflated CV
numbers. Video frames sampled at a few fps, fixed-camera captures, burst photos, and
repeated scenes all produce images that are visually near-identical but not byte-identical,
so exact-hash dedup misses them entirely.

Method: difference hash (dHash) at 8x8 -> 64-bit signature, compared by Hamming distance.
Fast, dependency-light, and robust to resize/recompression. Also reports filename-stem
clustering, which hints at frame_0001/frame_0002 style sequences that dHash may miss when
the camera pans. A shared filename stem is a heuristic suspicion, not proof: names such as
0001.jpg carry no grouping information and are not grouped at all. Supply verified groups
(source video, capture session, subject or patient, production lot) with --groups to turn
group overlap into a confirmed finding.

Usage:
    python split_leakage_check.py --splits train=/data/train val=/data/val test=/data/test
    python split_leakage_check.py --splits train=a val=b --threshold 8 --report leakage.md
    python split_leakage_check.py --splits train=a val=b --groups groups.csv

--groups takes a CSV with the columns path,group. path is relative to its split directory
or absolute.

Exit codes: 0 = no confirmed leakage, 1 = leakage found (usable as a CI gate). Leakage
means near-duplicate images across splits or a verified group in more than one split.
Filename-stem overlap alone is reported as suspected and fails only with
--fail-on-filename-groups. A clean result does not rule out leakage through metadata
(the same subject, patient or product photographed differently).
"""

import argparse
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def dhash(path, size=8):
    """64-bit difference hash. Returns np.uint8 array of 64 bits, or None on failure."""
    try:
        img = Image.open(path).convert("L").resize((size + 1, size), Image.BILINEAR)
    except Exception:
        return None
    a = np.asarray(img, dtype=np.int16)
    return (a[:, 1:] > a[:, :-1]).flatten().astype(np.uint8)


def collect(root):
    root = Path(root)
    if not root.exists():
        raise SystemExit(f"error: split path does not exist: {root}")
    return sorted(p for p in root.rglob("*") if p.suffix.lower() in IMG_EXT)


def stem_group(name):
    """Strip trailing digits so frame_0001 and frame_0002 share a group.

    Returns None when nothing but separators would remain (0001.jpg, 17.png): a purely
    numeric name says nothing about the capture it came from, and grouping all such files
    under one empty key would report unrelated images as a shared sequence.
    """
    group = re.sub(r"[_\-]?\d+$", "", Path(name).stem)
    return group if re.search(r"[^\W_]", group) else None


def load_groups(path, splits):
    """Read a path,group CSV and return {resolved image path: group}."""
    try:
        with open(path, newline="") as handle:
            rows = list(csv.DictReader(handle))
    except OSError as exc:
        raise SystemExit(f"error: cannot read --groups file: {exc}")
    if not rows or not {"path", "group"} <= set(rows[0]):
        raise SystemExit("error: --groups CSV needs a header with the columns path,group")
    mapping = {}
    for row in rows:
        image, group = (row["path"] or "").strip(), (row["group"] or "").strip()
        if not image or not group:
            raise SystemExit(f"error: --groups row needs both path and group: {row}")
        candidates = [Path(image)] if Path(image).is_absolute() else [Path(root) / image for root in splits.values()]
        for candidate in candidates:
            mapping[candidate.resolve()] = group
    return mapping


def hamming_matrix(a, b):
    """Pairwise Hamming distance between two bit matrices, in chunks to bound memory."""
    out = np.empty((a.shape[0], b.shape[0]), dtype=np.uint8)
    step = max(1, 2_000_000 // max(b.shape[0], 1))
    for i in range(0, a.shape[0], step):
        chunk = a[i : i + step]
        out[i : i + step] = (chunk[:, None, :] != b[None, :, :]).sum(axis=2)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--splits", nargs="+", required=True,
                    help="name=path pairs, e.g. train=/data/train val=/data/val")
    ap.add_argument("--threshold", type=int, default=6,
                    help="max Hamming distance counted as a near-duplicate (0-64). "
                         "0-4 = near identical, 5-10 = same scene, >12 = loose. Default 6")
    ap.add_argument("--report", default=None, help="write a markdown report to this path")
    ap.add_argument("--groups", default=None, metavar="CSV",
                    help="CSV with columns path,group naming verified groups (video, session, subject, "
                         "lot). A group found in more than one split is reported as leakage.")
    ap.add_argument("--fail-on-filename-groups", action="store_true",
                    help="also exit 1 when only the filename-stem heuristic finds shared groups")
    ap.add_argument("--max-examples", type=int, default=15, help="example pairs to list per split pair")
    args = ap.parse_args()

    splits = {}
    for item in args.splits:
        if "=" not in item:
            raise SystemExit(f"error: --splits entries must be name=path, got {item!r}")
        name, path = item.split("=", 1)
        splits[name] = path

    if len(splits) < 2:
        raise SystemExit("error: need at least two splits to check for leakage")

    print("Hashing images...", file=sys.stderr)
    data = {}
    for name, path in splits.items():
        files = collect(path)
        hashes, kept = [], []
        for f in files:
            h = dhash(f)
            if h is not None:
                hashes.append(h)
                kept.append(f)
        if not kept:
            raise SystemExit(f"error: no readable images found in split {name!r} ({path})")
        data[name] = {"files": kept, "hashes": np.array(hashes, dtype=np.uint8)}
        print(f"  {name}: {len(kept)} images", file=sys.stderr)

    lines = ["# Split leakage report", ""]
    lines.append(f"Threshold: Hamming distance <= {args.threshold} (of 64 bits)")
    lines.append("")
    lines.append("| Split | Images |")
    lines.append("|---|---|")
    for name in splits:
        lines.append(f"| {name} | {len(data[name]['files'])} |")
    lines.append("")

    leak_found = False
    names = list(splits)

    # --- cross-split near-duplicate detection ---
    lines.append("## Cross-split near-duplicates")
    lines.append("")
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]
            print(f"Comparing {a} vs {b}...", file=sys.stderr)
            dist = hamming_matrix(data[a]["hashes"], data[b]["hashes"])
            hits = np.argwhere(dist <= args.threshold)

            n_a = len(set(hits[:, 0].tolist())) if len(hits) else 0
            pct = 100.0 * n_a / len(data[a]["files"])

            if len(hits) == 0:
                lines.append(f"**{a} vs {b}**: clean — no pairs within threshold.")
                lines.append("")
                continue

            leak_found = True
            lines.append(f"**{a} vs {b}**: {len(hits)} near-duplicate pairs, "
                         f"affecting {n_a} `{a}` images ({pct:.1f}% of {a}).")
            lines.append("")
            lines.append("| distance | " + a + " | " + b + " |")
            lines.append("|---|---|---|")
            order = np.argsort(dist[hits[:, 0], hits[:, 1]])
            for k in order[: args.max_examples]:
                ia, ib = hits[k]
                lines.append(f"| {dist[ia, ib]} | `{data[a]['files'][ia].name}` | `{data[b]['files'][ib].name}` |")
            if len(hits) > args.max_examples:
                lines.append(f"| ... | _{len(hits) - args.max_examples} more_ | |")
            lines.append("")

    # --- verified group overlap ---
    if args.groups:
        assigned = load_groups(args.groups, splits)
        lines.append("## Verified group overlap")
        lines.append("")
        verified = defaultdict(set)
        missing = 0
        for name in names:
            for f in data[name]["files"]:
                group = assigned.get(f.resolve())
                if group is None:
                    missing += 1
                else:
                    verified[group].add(name)
        crossing = {g: s for g, s in verified.items() if len(s) > 1}
        if crossing:
            leak_found = True
            lines.append(f"**{len(crossing)} verified group(s) span multiple splits.**")
            lines.append("")
            lines.append("| group | splits |")
            lines.append("|---|---|")
            for g, s in list(crossing.items())[: args.max_examples]:
                lines.append(f"| `{g}` | {', '.join(sorted(s))} |")
            if len(crossing) > args.max_examples:
                lines.append(f"| ... | _{len(crossing) - args.max_examples} more_ |")
        else:
            lines.append("No verified group spans multiple splits.")
        if missing:
            lines.append("")
            lines.append(f"{missing} image(s) have no entry in the groups file and were not checked by group.")
        lines.append("")

    # --- filename-stem group overlap (heuristic) ---
    lines.append("## Filename group overlap (heuristic)")
    lines.append("")
    lines.append("Sequences like `frame_0001` / `frame_0002` share a group. A group appearing in "
                 "more than one split is a suspicion, not proof: confirm with capture metadata "
                 "(or pass verified groups with --groups) before re-splitting.")
    lines.append("")
    groups = defaultdict(set)
    ungrouped = 0
    for name in names:
        for f in data[name]["files"]:
            group = stem_group(f.name)
            if group is None:
                ungrouped += 1
            else:
                groups[group].add(name)
    shared = {g: s for g, s in groups.items() if len(s) > 1}
    if shared:
        if args.fail_on_filename_groups:
            leak_found = True
        lines.append(f"**{len(shared)} filename group(s) span multiple splits (suspected).**")
        lines.append("")
        lines.append("| group | splits |")
        lines.append("|---|---|")
        for g, s in list(shared.items())[: args.max_examples]:
            lines.append(f"| `{g}` | {', '.join(sorted(s))} |")
        if len(shared) > args.max_examples:
            lines.append(f"| ... | _{len(shared) - args.max_examples} more_ |")
    else:
        lines.append("No filename groups span multiple splits.")
    if ungrouped:
        lines.append("")
        lines.append(f"{ungrouped} image(s) have purely numeric names and were not grouped by filename.")
    lines.append("")

    # --- verdict ---
    lines.append("## Verdict")
    lines.append("")
    if leak_found:
        lines.append("**LEAKAGE DETECTED.** Metrics from these splits are optimistic and should "
                     "not be reported to a customer.")
        lines.append("")
        lines.append("Re-split by group rather than by image. Group by whichever of these applies: "
                     "source video, capture session, camera/site, subject or patient, production lot, "
                     "or time window. Every image in a group must land in exactly one split.")
        lines.append("")
        lines.append("Note that this check is visual only. It cannot detect leakage from a shared "
                     "subject photographed from different angles, so also confirm the split respects "
                     "whatever grouping exists in the metadata.")
    elif shared:
        lines.append("**No confirmed leakage; filename groups span splits (SUSPECTED).** No near-duplicate "
                     "images were found at this threshold. Check the listed groups against capture "
                     "metadata (source video, session, subject, lot); if they are real groups, re-split "
                     "by group or re-run with --groups.")
    else:
        lines.append("No leakage detected at this threshold. Consider re-running with a higher "
                     "threshold (e.g. 10-12) to catch same-scene-different-frame cases, and confirm "
                     "the split respects any grouping present in the capture metadata: different "
                     "images can still share a subject, patient or product.")
    lines.append("")

    report = "\n".join(lines)
    if args.report:
        Path(args.report).write_text(report)
        print(f"\nReport written to {args.report}", file=sys.stderr)
    print(report)
    return 1 if leak_found else 0


if __name__ == "__main__":
    sys.exit(main())
