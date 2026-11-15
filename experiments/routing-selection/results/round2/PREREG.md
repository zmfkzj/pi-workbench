# Pre-registered evaluation plan (written before any stage-2 measurement result)

Budget: total new measurement ceiling USD 25 (user-approved). Hard harness cap `--cost-cap 23` on one shared ledger
(eval/ledger.jsonl) for every stage, model and rerun; a run without a reported cost is charged its run cap.
Sonnet = cliproxyapi/claude-sonnet-5-5 thinking medium (decides adoption); Haiku = cliproxyapi/claude-haiku-5-5 thinking low (auxiliary only).
All runs use the fixed harness (success-based tool_execution_end accounting). Old 408 records are not mixed in.

## Stage 1 — research index path (variant r2 = working tree before change, A = r2 + index clarification)
Requests: single-cell, reviewer-response, phylo-tree, msms-spectra, mri-layout, censored-survival. Sonnet 3 reps, Haiku 3 reps.
Adopt A (already structurally verified) unless, on Sonnet:
- A has more wrong-path calls on research runs than r2, or
- specialist reach on the 5 specialist requests is lower for A than r2 by more than 1 run in total, or
- router reach drops by more than 1/3 of reps on any request.
Report: index use (read/grep), wrong-path calls, specialist reach, prompt tokens, cost.

## Stage 2 — statistical-power selective wrapper
Baseline: the 5 sample-size requests (sample-size, ss-two-group-ko, ss-animal-ko, ss-ab-test, ss-cluster), Sonnet 3 reps, current variant.
If baseline statistical-power/experimental-design reach is >= 8/15, stop: no wrapper experiment needed.
Otherwise W = current + one wrapper skill `skills/statistical-power/SKILL.md` (short description, link to the bundled original, Pi notes).
Adopt W only if ALL hold (Sonnet):
1. sample-size reach W >= 8/15 and >= baseline + 5;
2. on the regression requests (all other read-only requests) the wrapper is opened in at most 1 run;
3. no regression request loses router or skill reach by more than 1/3 of its reps versus the current variant;
4. first-call prompt token increase <= 300 tokens (recorded);
5. small quality review (below) shows W answers are not worse than baseline answers.
Quality review (method fixed now): for each sample-size request pick paired answers (baseline vs W, same rep index),
labels hidden (shuffled A/B), scored by this worker (an LLM, not a human expert) on a 5-point rubric:
 (1) numeric sample size within ±10% of the reference computed with statsmodels/standard formula (or correct method when inputs are insufficient),
 (2) states alpha, sidedness, power and effect-size assumptions,
 (3) addresses where the effect size comes from / warns against unfounded effect sizes,
 (4) adjusts or discusses attrition/design effect where relevant,
 (5) no fabricated citations or tool runs claimed.
Limits: single non-human reviewer, small n, rubric scores are not a validated quality measure.

## Stage 3 — realistic Archify diagram evaluation (writable workspace with payments fixture, bash/write, Chrome via ARCHIFY_CHROME)
Requests: diagram-html (positive), diagram-mermaid and diagram-prose (negatives), Sonnet 3 reps; variants current vs D
(D = wording candidate: coding/analysis routing and guidance name sequence/workflow diagrams delivered as standalone HTML
files; Mermaid-only or prose answers do not need Archify).
Regression: light-dismiss, mv3-worker, scroll-progress, sequence-diagram (read-only), Sonnet 2 reps, both variants.
Adopt D only if: Archify reach on diagram-html with D >= current + 2 (of 3) or current already 3/3 and D 3/3 (then no change needed);
negatives open Archify in 0 D runs (and not more than current); regression requests lose no more than 1/3 of reps.
If current already reaches Archify on diagram-html in >= 2/3 runs, D is not adopted (no evidence of need).
Report finalize pass/fail separately from routing; automated gates are not visual review.

## Stage 1 addendum (written after the first 36 Sonnet runs, before the extension)
First result: r2 vs A routing descriptions are byte-identical (system prompts differ only in the opaque package hash),
so router opening cannot be affected by A; the mri-layout 2/3 -> 0/3 router drop and specialist differences that follow
it are first-step noise. A's 2 wrong-path calls dropped the `pi-workbench` path segment on a table link (not the index).
Post-hoc extension (disclosed as such): 3 more Sonnet reps of single-cell, phylo-tree, msms-spectra, mri-layout,
censored-survival for both variants (pooled 6 reps). Read-path decision on runs that opened wb-research:
keep A if index wrong-path calls A = 0, index use (read/grep) A >= r2, specialist reach given router A >= r2 - 1,
and total wrong-path calls given router A <= r2 + 1. Otherwise revert A to r2 wording and report.

## Stage 2 quality-review references (computed with scipy noncentral t / normal approximations before reading any answer)
- sample-size: d=0.5, two-sided alpha .05, power .80 -> 64 per group (t-test).
- ss-two-group-ko: d=0.4, power .90 -> 133 per group.
- ss-animal-ko: d~1.0, power .80 -> 17 per group (23 at .90); should note the d=1 assumption from one prior study is fragile.
- ss-ab-test: 12% -> 15%, two-sided .05, power .80 -> ~2,030-2,040 per arm (~4,070 total, ~2-3 days at 2,000/day); should recommend running whole weeks.
- ss-cluster: 10 schools per arm, ICC .05, 0.25 SD: 80% power is NOT attainable with 20 schools (max ~70% as m->inf; m=25 -> ~47%); correct answer says more schools are needed.
