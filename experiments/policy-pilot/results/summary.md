# Policy pilot results

Costs are Pi list-price calculations from the provider model catalog (not invoices).

- Original runs (stages 1–2): planned 90, executed 90, accepted 90, errors/aborts 0; list price $10.82.
- Stage 3 replacements in the sandbox boundary: planned 40, executed 40, accepted 40, errors/aborts 0; list price $2.11.
- Original runs excluded in the corrected view (pair group replaced): 40.
- Model runs total: $12.92; blinded T4 rubric judging: $0.35 (34 judgements).
- Total wall time (sum over runs): 128.7 min.

## Blinded T4 rubric (gpt-6.1-sol, labels hidden)

| Run | confound | no_causal_claim | discriminating_next_step | observed_vs_model | measurement_system |
|---|---|---|---|---|---|
| S2-T4-current-mfg-r1 | 1 | 1 | 1 | 1 | 1 |
| S2-T4-current-mfg-r2 | 1 | 1 | 1 | 1 | 1 |
| S2-T4-r4-mfg-r1 | 1 | 1 | 1 | 1 | 1 |
| S2-T4-r4-mfg-r2 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-current-r1 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-current-r2 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-current-select-r1 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-current-select-r2 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-off-r1 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-off-r2 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-r4-r1 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-r4-r2 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-r4-select-r1 | 1 | 1 | 1 | 1 | 1 |
| S2h-T4-r4-select-r2 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-current-r1 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-current-r2 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-current-select-r1 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-current-select-r2 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-off-r1 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-off-r2 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-r4-r1 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-r4-r2 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-r4-select-r1 | 1 | 1 | 1 | 1 | 1 |
| S3-S2h-T4-r4-select-r2 | 1 | 1 | 1 | 1 | 1 |
| T4-current-r1 | 1 | 1 | 1 | 1 | 1 |
| T4-current-r2 | 1 | 1 | 1 | 1 | 1 |
| T4-current-select-r1 | 1 | 1 | 1 | 1 | 1 |
| T4-current-select-r2 | 1 | 1 | 1 | 1 | 1 |
| T4-off-r1 | 1 | 1 | 1 | 1 | 1 |
| T4-off-r2 | 1 | 1 | 1 | 1 | 1 |
| T4-r4-r1 | 1 | 1 | 1 | 1 | 1 |
| T4-r4-r2 | 1 | 1 | 1 | 1 | 1 |
| T4-r4-select-r1 | 1 | 1 | 1 | 1 | 1 |
| T4-r4-select-r2 | 1 | 1 | 1 | 1 | 1 |

## As recorded (original 90 runs, shared /tmp not excluded)

### Per model, mode, task and configuration (exposure = runs that opened the file / valid runs)

| Model | Mode | Task | Config | Planned | Attempted | Valid | Accepted (of valid) | Excluded | Errors | Mean cost $ | Mean input tok | Mean wall s | Mean tool calls | Tests after last edit | Install attempts | Router read | Ponytail | ECC | Verification | ast-grep/Context7 | DMAIC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5:high | auto | T1-csv-export | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.006 | 84934 | 42 | 12.0 | 1/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T1-csv-export | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.005 | 71744 | 41 | 12.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r1 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.005 | 69515 | 34 | 10.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r2 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.006 | 102360 | 39 | 14.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.003 | 73452 | 25 | 8.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.001 | 79526 | 29 | 10.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r1 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.003 | 67481 | 25 | 9.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r2 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.003 | 83802 | 31 | 8.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.006 | 83553 | 47 | 16.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.004 | 47276 | 31 | 9.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3a | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.006 | 63206 | 38 | 12.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3b | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.006 | 65738 | 37 | 10.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.021 | 349049 | 127 | 17.5 | 0/2 | 3 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.019 | 345672 | 121 | 17.0 | 0/2 | 2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | r4 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.017 | 468832 | 136 | 17.5 | 0/2 | 2 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | select | T4-coolant-decision | current-select | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.022 | 467662 | 128 | 15.0 | 0/2 | 3 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | select | T4-coolant-decision | r4-select | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.025 | 577805 | 141 | 20.5 | 0/2 | 4 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 2/2 |
| claude-opus-5-5:high | auto | T1-csv-export | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.118 | 58045 | 33 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T1-csv-export | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.058 | 27314 | 32 | 7.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T1-csv-export | r1 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.122 | 53936 | 34 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T1-csv-export | r2 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.123 | 53708 | 33 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.106 | 60495 | 26 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.069 | 26484 | 21 | 6.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | r1 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.100 | 46905 | 25 | 7.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | r2 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.099 | 46659 | 24 | 7.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.143 | 57398 | 48 | 9.0 | 2/2 | 0 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.110 | 29767 | 38 | 5.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3a | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.076 | 41862 | 43 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3b | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.083 | 51367 | 41 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T4-coolant-decision | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.353 | 131038 | 117 | 11.5 | 0/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T4-coolant-decision | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.336 | 126994 | 119 | 11.5 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T4-coolant-decision | r4 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.232 | 127230 | 122 | 10.0 | 0/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T1-csv-export | current-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.144 | 72540 | 34 | 7.5 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T1-csv-export | r1-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.123 | 56532 | 32 | 6.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T1-csv-export | r2-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.144 | 74247 | 36 | 8.5 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T2-duration-cli | current-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.086 | 81082 | 37 | 9.5 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T2-duration-cli | r1-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.114 | 58744 | 24 | 6.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T2-duration-cli | r2-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.132 | 69661 | 29 | 8.0 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T3-migrate-calls | current-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.159 | 65466 | 46 | 6.0 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3a-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.165 | 75021 | 46 | 8.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3b-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.088 | 78662 | 41 | 8.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T4-coolant-decision | current-mfg | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.475 | 234653 | 144 | 13.5 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 1/2 |
| claude-opus-5-5:high | profile | T4-coolant-decision | r4-mfg | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.475 | 286400 | 138 | 14.0 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 1/2 |
| claude-opus-5-5:high | select | T4-coolant-decision | current-select | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.530 | 361196 | 142 | 13.0 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 2/2 |
| claude-opus-5-5:high | select | T4-coolant-decision | r4-select | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.486 | 279387 | 140 | 12.0 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 2/2 |

### Paired differences (variant − baseline; same model, mode, task and repetition; both runs valid). `current − off` is the package effect

| Model | Mode | Task | Comparison | Valid pairs | Accept (variant vs baseline) | Δ cost $ per pair | Δ input tok per pair | Δ wall s per pair | Δ tool calls per pair |
|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5:high | auto | T1-csv-export | current − off | 2 | 2/2 vs 2/2 | -0.000, +0.002 | -8483, +34862 | -8, +10 | -3, +2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r1 − current | 2 | 2/2 vs 2/2 | -0.000, -0.002 | -11663, -19175 | -2, -15 | -1, -2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r2 − current | 2 | 2/2 vs 2/2 | -0.000, -0.001 | +21867, +12985 | +0, -6 | +2, +2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | current − off | 2 | 2/2 vs 2/2 | +0.003, +0.002 | -7183, -4964 | -1, -6 | -1, -3 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r1 − current | 2 | 2/2 vs 2/2 | -0.001, +0.000 | -10950, -992 | -4, +2 | +0, +2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r2 − current | 2 | 2/2 vs 2/2 | -0.000, +0.000 | +11862, +8838 | -1, +12 | +1, +0 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | current − off | 2 | 2/2 vs 2/2 | +0.002, +0.001 | +40088, +32466 | +23, +9 | +13, +2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3a − current | 2 | 2/2 vs 2/2 | -0.001, +0.001 | -33617, -7076 | -19, +1 | -7, -2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3b − current | 2 | 2/2 vs 2/2 | -0.001, +0.000 | -27367, -8262 | -17, -3 | -13, +0 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | current − off | 2 | 2/2 vs 2/2 | +0.003, +0.002 | +48174, -41421 | +2, +10 | +1, +0 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | r4 − current | 2 | 2/2 vs 2/2 | +0.003, -0.010 | +231242, +8324 | +22, -5 | +5, -5 |
| claude-haiku-5-5:high | select | T4-coolant-decision | r4-select − current-select | 2 | 2/2 vs 2/2 | -0.001, +0.009 | +21540, +198747 | -14, +40 | +1, +10 |
| claude-opus-5-5:high | auto | T1-csv-export | current − off | 2 | 2/2 vs 2/2 | +0.101, +0.019 | +30200, +31261 | -1, +4 | +3, -2 |
| claude-opus-5-5:high | auto | T1-csv-export | r1 − current | 2 | 2/2 vs 2/2 | +0.008, +0.001 | +730, -8949 | +4, -4 | +0, +0 |
| claude-opus-5-5:high | auto | T1-csv-export | r2 − current | 2 | 2/2 vs 2/2 | +0.010, +0.000 | +981, -9655 | +4, -4 | +0, +0 |
| claude-opus-5-5:high | auto | T2-duration-cli | current − off | 2 | 2/2 vs 2/2 | +0.043, +0.029 | +47448, +20573 | +7, +2 | +3, +1 |
| claude-opus-5-5:high | auto | T2-duration-cli | r1 − current | 2 | 2/2 vs 2/2 | -0.014, +0.003 | -26997, -183 | -3, +2 | -2, +0 |
| claude-opus-5-5:high | auto | T2-duration-cli | r2 − current | 2 | 2/2 vs 2/2 | -0.014, +0.002 | -27106, -566 | -5, +1 | -2, +0 |
| claude-opus-5-5:high | auto | T3-migrate-calls | current − off | 2 | 2/2 vs 2/2 | +0.008, +0.057 | +20500, +34761 | +6, +15 | +1, +6 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3a − current | 2 | 2/2 vs 2/2 | -0.115, -0.020 | -16233, -14837 | -15, +4 | -1, -1 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3b − current | 2 | 2/2 vs 2/2 | -0.116, -0.004 | -5895, -6166 | -11, -3 | -1, -1 |
| claude-opus-5-5:high | auto | T4-coolant-decision | current − off | 2 | 2/2 vs 2/2 | +0.077, -0.041 | +30338, -22251 | +12, -15 | +1, -1 |
| claude-opus-5-5:high | auto | T4-coolant-decision | r4 − current | 2 | 2/2 vs 2/2 | -0.263, +0.021 | -28639, +21024 | +3, +7 | -3, +0 |
| claude-opus-5-5:high | profile | T1-csv-export | r1-profile − current-profile | 2 | 2/2 vs 2/2 | -0.031, -0.011 | -22398, -9618 | -5, -0 | -3, +0 |
| claude-opus-5-5:high | profile | T1-csv-export | r2-profile − current-profile | 2 | 2/2 vs 2/2 | -0.004, +0.003 | +8608, -5194 | -1, +3 | +0, +2 |
| claude-opus-5-5:high | profile | T2-duration-cli | r1-profile − current-profile | 2 | 2/2 vs 2/2 | +0.084, -0.028 | -24083, -20593 | -9, -16 | -5, -1 |
| claude-opus-5-5:high | profile | T2-duration-cli | r2-profile − current-profile | 2 | 2/2 vs 2/2 | +0.102, -0.011 | -22304, -537 | -4, -11 | -2, -1 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3a-profile − current-profile | 2 | 2/2 vs 2/2 | +0.004, +0.009 | -4925, +24036 | +2, -2 | +0, +5 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3b-profile − current-profile | 2 | 2/2 vs 2/2 | -0.140, -0.002 | +10985, +15407 | -2, -9 | +1, +4 |
| claude-opus-5-5:high | profile | T4-coolant-decision | r4-mfg − current-mfg | 2 | 2/2 vs 2/2 | -0.103, +0.102 | -72225, +175720 | -36, +24 | -4, +5 |
| claude-opus-5-5:high | select | T4-coolant-decision | r4-select − current-select | 2 | 2/2 vs 2/2 | -0.198, +0.110 | -292523, +128906 | -44, +38 | -4, +2 |

## Corrected (replaced pair groups excluded, stage 3 sandbox runs included)

### Per model, mode, task and configuration (exposure = runs that opened the file / valid runs)

| Model | Mode | Task | Config | Planned | Attempted | Valid | Accepted (of valid) | Excluded | Errors | Mean cost $ | Mean input tok | Mean wall s | Mean tool calls | Tests after last edit | Install attempts | Router read | Ponytail | ECC | Verification | ast-grep/Context7 | DMAIC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5:high | auto | T1-csv-export | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.006 | 84934 | 42 | 12.0 | 1/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T1-csv-export | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.005 | 71744 | 41 | 12.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r1 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.005 | 69515 | 34 | 10.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r2 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.006 | 102360 | 39 | 14.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | current | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.002 | 76076 | 25 | 11.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | off | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.002 | 75712 | 26 | 8.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r1 | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.002 | 73911 | 25 | 8.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r2 | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.004 | 73776 | 27 | 9.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | current | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.005 | 58505 | 33 | 11.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | off | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.005 | 58687 | 34 | 10.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3a | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.006 | 68597 | 39 | 13.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3b | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.007 | 77672 | 42 | 13.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | current | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.018 | 372202 | 115 | 17.0 | 0/2 | 3 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | off | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.017 | 327434 | 108 | 15.5 | 0/2 | 3 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | r4 | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.025 | 483754 | 161 | 19.0 | 0/2 | 3 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | select | T4-coolant-decision | current-select | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.011 | 360867 | 101 | 12.0 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-haiku-5-5:high | select | T4-coolant-decision | r4-select | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.022 | 472072 | 132 | 14.5 | 0/2 | 3 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 1/2 |
| claude-opus-5-5:high | auto | T1-csv-export | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.118 | 58045 | 33 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T1-csv-export | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.058 | 27314 | 32 | 7.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T1-csv-export | r1 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.122 | 53936 | 34 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T1-csv-export | r2 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.123 | 53708 | 33 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.106 | 60495 | 26 | 8.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.069 | 26484 | 21 | 6.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | r1 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.100 | 46905 | 25 | 7.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T2-duration-cli | r2 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.099 | 46659 | 24 | 7.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | current | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.141 | 59816 | 43 | 9.0 | 2/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | off | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.062 | 28133 | 34 | 7.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3a | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.143 | 51592 | 46 | 8.5 | 2/2 | 0 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3b | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.126 | 49238 | 38 | 8.0 | 2/2 | 0 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T4-coolant-decision | current | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.353 | 131038 | 117 | 11.5 | 0/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T4-coolant-decision | off | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.336 | 126994 | 119 | 11.5 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | auto | T4-coolant-decision | r4 | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.232 | 127230 | 122 | 10.0 | 0/2 | 0 | 2/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T1-csv-export | current-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.144 | 72540 | 34 | 7.5 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T1-csv-export | r1-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.123 | 56532 | 32 | 6.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T1-csv-export | r2-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.144 | 74247 | 36 | 8.5 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T2-duration-cli | current-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.086 | 81082 | 37 | 9.5 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T2-duration-cli | r1-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.114 | 58744 | 24 | 6.5 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T2-duration-cli | r2-profile | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.132 | 69661 | 29 | 8.0 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T3-migrate-calls | current-profile | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.151 | 68101 | 41 | 8.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3a-profile | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.152 | 69606 | 39 | 7.5 | 2/2 | 0 | 0/2 | 1/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3b-profile | 4 | 4 | 2 | 2/2 | 2 | 0 | 0.154 | 73826 | 39 | 8.0 | 2/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 |
| claude-opus-5-5:high | profile | T4-coolant-decision | current-mfg | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.475 | 234653 | 144 | 13.5 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 1/2 |
| claude-opus-5-5:high | profile | T4-coolant-decision | r4-mfg | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.475 | 286400 | 138 | 14.0 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 1/2 |
| claude-opus-5-5:high | select | T4-coolant-decision | current-select | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.530 | 361196 | 142 | 13.0 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 2/2 |
| claude-opus-5-5:high | select | T4-coolant-decision | r4-select | 2 | 2 | 2 | 2/2 | 0 | 0 | 0.486 | 279387 | 140 | 12.0 | 0/2 | 0 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 2/2 |

### Paired differences (variant − baseline; same model, mode, task and repetition; both runs valid). `current − off` is the package effect

| Model | Mode | Task | Comparison | Valid pairs | Accept (variant vs baseline) | Δ cost $ per pair | Δ input tok per pair | Δ wall s per pair | Δ tool calls per pair |
|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5:high | auto | T1-csv-export | current − off | 2 | 2/2 vs 2/2 | -0.000, +0.002 | -8483, +34862 | -8, +10 | -3, +2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r1 − current | 2 | 2/2 vs 2/2 | -0.000, -0.002 | -11663, -19175 | -2, -15 | -1, -2 |
| claude-haiku-5-5:high | auto | T1-csv-export | r2 − current | 2 | 2/2 vs 2/2 | -0.000, -0.001 | +21867, +12985 | +0, -6 | +2, +2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | current − off | 2 | 2/2 vs 2/2 | +0.001, +0.000 | +1186, -458 | -2, -1 | +6, -1 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r1 − current | 2 | 2/2 vs 2/2 | -0.003, +0.003 | -9795, +5465 | -5, +5 | -7, +2 |
| claude-haiku-5-5:high | auto | T2-duration-cli | r2 − current | 2 | 2/2 vs 2/2 | -0.001, +0.003 | -9508, +4907 | -2, +5 | -6, +3 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | current − off | 2 | 2/2 vs 2/2 | +0.001, +0.001 | -1235, +871 | -2, +0 | +3, +0 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3a − current | 2 | 2/2 vs 2/2 | -0.000, +0.001 | +2215, +17969 | +4, +7 | -4, +7 |
| claude-haiku-5-5:high | auto | T3-migrate-calls | r3b − current | 2 | 2/2 vs 2/2 | +0.002, +0.000 | +19770, +18565 | +12, +6 | +3, +1 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | current − off | 2 | 2/2 vs 2/2 | +0.001, +0.002 | +22783, +66754 | +4, +10 | +3, +0 |
| claude-haiku-5-5:high | auto | T4-coolant-decision | r4 − current | 2 | 2/2 vs 2/2 | +0.008, +0.006 | +182383, +40720 | +46, +47 | +2, +2 |
| claude-haiku-5-5:high | select | T4-coolant-decision | r4-select − current-select | 2 | 2/2 vs 2/2 | +0.007, +0.015 | +106331, +116078 | +33, +29 | +2, +3 |
| claude-opus-5-5:high | auto | T1-csv-export | current − off | 2 | 2/2 vs 2/2 | +0.101, +0.019 | +30200, +31261 | -1, +4 | +3, -2 |
| claude-opus-5-5:high | auto | T1-csv-export | r1 − current | 2 | 2/2 vs 2/2 | +0.008, +0.001 | +730, -8949 | +4, -4 | +0, +0 |
| claude-opus-5-5:high | auto | T1-csv-export | r2 − current | 2 | 2/2 vs 2/2 | +0.010, +0.000 | +981, -9655 | +4, -4 | +0, +0 |
| claude-opus-5-5:high | auto | T2-duration-cli | current − off | 2 | 2/2 vs 2/2 | +0.043, +0.029 | +47448, +20573 | +7, +2 | +3, +1 |
| claude-opus-5-5:high | auto | T2-duration-cli | r1 − current | 2 | 2/2 vs 2/2 | -0.014, +0.003 | -26997, -183 | -3, +2 | -2, +0 |
| claude-opus-5-5:high | auto | T2-duration-cli | r2 − current | 2 | 2/2 vs 2/2 | -0.014, +0.002 | -27106, -566 | -5, +1 | -2, +0 |
| claude-opus-5-5:high | auto | T3-migrate-calls | current − off | 2 | 2/2 vs 2/2 | +0.130, +0.030 | +34487, +28878 | +14, +6 | +2, +2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3a − current | 2 | 2/2 vs 2/2 | +0.018, -0.016 | +4845, -21291 | +10, -3 | +1, -2 |
| claude-opus-5-5:high | auto | T3-migrate-calls | r3b − current | 2 | 2/2 vs 2/2 | -0.005, -0.027 | +914, -22068 | -3, -7 | +0, -2 |
| claude-opus-5-5:high | auto | T4-coolant-decision | current − off | 2 | 2/2 vs 2/2 | +0.077, -0.041 | +30338, -22251 | +12, -15 | +1, -1 |
| claude-opus-5-5:high | auto | T4-coolant-decision | r4 − current | 2 | 2/2 vs 2/2 | -0.263, +0.021 | -28639, +21024 | +3, +7 | -3, +0 |
| claude-opus-5-5:high | profile | T1-csv-export | r1-profile − current-profile | 2 | 2/2 vs 2/2 | -0.031, -0.011 | -22398, -9618 | -5, -0 | -3, +0 |
| claude-opus-5-5:high | profile | T1-csv-export | r2-profile − current-profile | 2 | 2/2 vs 2/2 | -0.004, +0.003 | +8608, -5194 | -1, +3 | +0, +2 |
| claude-opus-5-5:high | profile | T2-duration-cli | r1-profile − current-profile | 2 | 2/2 vs 2/2 | +0.084, -0.028 | -24083, -20593 | -9, -16 | -5, -1 |
| claude-opus-5-5:high | profile | T2-duration-cli | r2-profile − current-profile | 2 | 2/2 vs 2/2 | +0.102, -0.011 | -22304, -537 | -4, -11 | -2, -1 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3a-profile − current-profile | 2 | 2/2 vs 2/2 | +0.013, -0.012 | +9884, -6873 | +2, -5 | +0, -1 |
| claude-opus-5-5:high | profile | T3-migrate-calls | r3b-profile − current-profile | 2 | 2/2 vs 2/2 | +0.025, -0.020 | +14122, -2673 | +11, -14 | +1, -1 |
| claude-opus-5-5:high | profile | T4-coolant-decision | r4-mfg − current-mfg | 2 | 2/2 vs 2/2 | -0.103, +0.102 | -72225, +175720 | -36, +24 | -4, +5 |
| claude-opus-5-5:high | select | T4-coolant-decision | r4-select − current-select | 2 | 2/2 vs 2/2 | -0.198, +0.110 | -292523, +128906 | -44, +38 | -4, +2 |

## Workbench files read per run

| Run | Files |
|---|---|
| S2-T1-current-profile-r1 | vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T1-current-profile-r2 | (none) |
| S2-T1-r1-profile-r1 | docs/WORKFLOWS.ko.md |
| S2-T1-r1-profile-r2 | (none) |
| S2-T1-r2-profile-r1 | docs/WORKFLOWS.ko.md |
| S2-T1-r2-profile-r2 | docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T2-current-profile-r1 | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T2-current-profile-r2 | (none) |
| S2-T2-r1-profile-r1 | docs/WORKFLOWS.ko.md |
| S2-T2-r1-profile-r2 | docs/WORKFLOWS.ko.md |
| S2-T2-r2-profile-r1 | docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T2-r2-profile-r2 | docs/WORKFLOWS.ko.md |
| S2-T3-current-profile-r1 (excluded in corrected view) | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T3-current-profile-r2 (excluded in corrected view) | docs/WORKFLOWS.ko.md |
| S2-T3-r3a-profile-r1 (excluded in corrected view) | (none) |
| S2-T3-r3a-profile-r2 (excluded in corrected view) | (none) |
| S2-T3-r3b-profile-r1 (excluded in corrected view) | docs/WORKFLOWS.ko.md |
| S2-T3-r3b-profile-r2 (excluded in corrected view) | (none) |
| S2-T4-current-mfg-r1 | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/SKILL.md |
| S2-T4-current-mfg-r2 | (none) |
| S2-T4-r4-mfg-r1 | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/SKILL.md |
| S2-T4-r4-mfg-r2 | (none) |
| S2h-T1-current-r1 | (none) |
| S2h-T1-current-r2 | (none) |
| S2h-T1-r1-r1 | (none) |
| S2h-T1-r1-r2 | (none) |
| S2h-T1-r2-r1 | (none) |
| S2h-T1-r2-r2 | (none) |
| S2h-T2-current-r1 (excluded in corrected view) | (none) |
| S2h-T2-current-r2 (excluded in corrected view) | (none) |
| S2h-T2-r1-r1 (excluded in corrected view) | (none) |
| S2h-T2-r1-r2 (excluded in corrected view) | (none) |
| S2h-T2-r2-r1 (excluded in corrected view) | (none) |
| S2h-T2-r2-r2 (excluded in corrected view) | (none) |
| S2h-T3-current-r1 (excluded in corrected view) | (none) |
| S2h-T3-current-r2 (excluded in corrected view) | (none) |
| S2h-T3-r3a-r1 (excluded in corrected view) | (none) |
| S2h-T3-r3a-r2 (excluded in corrected view) | (none) |
| S2h-T3-r3b-r1 (excluded in corrected view) | (none) |
| S2h-T3-r3b-r2 (excluded in corrected view) | (none) |
| S2h-T4-current-r1 (excluded in corrected view) | skills/wb-manufacturing/SKILL.md |
| S2h-T4-current-r2 (excluded in corrected view) | skills/wb-manufacturing/SKILL.md |
| S2h-T4-current-select-r1 (excluded in corrected view) | docs/ADAPTERS.md |
| S2h-T4-current-select-r2 (excluded in corrected view) | docs/ADAPTERS.md |
| S2h-T4-r4-r1 (excluded in corrected view) | docs/WORKFLOWS.ko.md<br>skills/wb-manufacturing/SKILL.md |
| S2h-T4-r4-r2 (excluded in corrected view) | skills/wb-manufacturing/SKILL.md |
| S2h-T4-r4-select-r1 (excluded in corrected view) | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| S2h-T4-r4-select-r2 (excluded in corrected view) | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/phase-3-analyze.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| S3-S2-T3-current-profile-r1 | docs/WORKFLOWS.ko.md |
| S3-S2-T3-current-profile-r2 | (none) |
| S3-S2-T3-r3a-profile-r1 | (none) |
| S3-S2-T3-r3a-profile-r2 | vendor/ponytail/skills/ponytail/SKILL.md |
| S3-S2-T3-r3b-profile-r1 | (none) |
| S3-S2-T3-r3b-profile-r2 | (none) |
| S3-S2h-T2-current-r1 | (none) |
| S3-S2h-T2-current-r2 | (none) |
| S3-S2h-T2-r1-r1 | (none) |
| S3-S2h-T2-r1-r2 | (none) |
| S3-S2h-T2-r2-r1 | (none) |
| S3-S2h-T2-r2-r2 | (none) |
| S3-S2h-T3-current-r1 | (none) |
| S3-S2h-T3-current-r2 | (none) |
| S3-S2h-T3-r3a-r1 | (none) |
| S3-S2h-T3-r3a-r2 | (none) |
| S3-S2h-T3-r3b-r1 | (none) |
| S3-S2h-T3-r3b-r2 | (none) |
| S3-S2h-T4-current-r1 | skills/wb-manufacturing/SKILL.md |
| S3-S2h-T4-current-r2 | skills/wb-manufacturing/SKILL.md |
| S3-S2h-T4-current-select-r1 | docs/ADAPTERS.md |
| S3-S2h-T4-current-select-r2 | docs/ADAPTERS.md |
| S3-S2h-T4-r4-r1 | skills/wb-manufacturing/SKILL.md |
| S3-S2h-T4-r4-r2 | skills/wb-manufacturing/SKILL.md |
| S3-S2h-T4-r4-select-r1 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| S3-S2h-T4-r4-select-r2 | docs/ADAPTERS.md |
| S3-T3-current-r1 | skills/wb-coding/SKILL.md |
| S3-T3-current-r2 | skills/wb-coding/SKILL.md |
| S3-T3-r3a-r1 | skills/wb-coding/SKILL.md |
| S3-T3-r3a-r2 | (none) |
| S3-T3-r3b-r1 | skills/wb-coding/SKILL.md |
| S3-T3-r3b-r2 | (none) |
| T1-current-r1 | skills/wb-coding/SKILL.md |
| T1-current-r2 | skills/wb-coding/SKILL.md |
| T1-r1-r1 | skills/wb-coding/SKILL.md |
| T1-r1-r2 | skills/wb-coding/SKILL.md |
| T1-r2-r1 | skills/wb-coding/SKILL.md |
| T1-r2-r2 | skills/wb-coding/SKILL.md |
| T2-current-r1 | skills/wb-coding/SKILL.md |
| T2-current-r2 | skills/wb-coding/SKILL.md |
| T2-r1-r1 | skills/wb-coding/SKILL.md |
| T2-r1-r2 | skills/wb-coding/SKILL.md |
| T2-r2-r1 | skills/wb-coding/SKILL.md |
| T2-r2-r2 | skills/wb-coding/SKILL.md |
| T3-current-r1 (excluded in corrected view) | (none) |
| T3-current-r2 (excluded in corrected view) | skills/wb-coding/SKILL.md |
| T3-r3a-r1 (excluded in corrected view) | skills/wb-coding/SKILL.md |
| T3-r3a-r2 (excluded in corrected view) | skills/wb-coding/SKILL.md |
| T3-r3b-r1 (excluded in corrected view) | skills/wb-coding/SKILL.md |
| T3-r3b-r2 (excluded in corrected view) | skills/wb-coding/SKILL.md |
| T4-current-r1 | docs/WORKFLOWS.ko.md<br>skills/wb-manufacturing/SKILL.md |
| T4-current-r2 | skills/wb-manufacturing/SKILL.md |
| T4-current-select-r1 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| T4-current-select-r2 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| T4-r4-r1 | skills/wb-manufacturing/SKILL.md |
| T4-r4-r2 | skills/wb-manufacturing/SKILL.md |
| T4-r4-select-r1 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/phase-2-measure.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/phase-3-analyze.md |
| T4-r4-select-r2 | docs/ADAPTERS.md |

## Failed checks, aborts and notable behaviour

- **S2h-T4-current-r1**: install attempts: cd /tmp && (python3 -c "import mpmath; print('mpmath', mpmath.__version__)" 2>&1 | tail -1); (timeout 60 pip install --q || cd /tmp && (python3 -m pip --version 2>&1; python3 -m venv /tmp/ra_venv 2>&1 | tail -2 && /tmp/ra_venv/bin/pip install -
- **S2h-T4-current-r2**: install attempts: cd <scratch>/runs/S2h-T4-current-r2/work/project; cat README.md; echo ---; git log --oneline | head; git status --short;
- **S2h-T4-current-select-r1**: install attempts: cd /tmp && python3 -m venv /tmp/dmaic_venv 2>&1 | tail -3 && /tmp/dmaic_venv/bin/pip install -q scipy numpy 2>&1 | tail  || cd /tmp && rm -rf /tmp/dmaic_venv; (which uv && uv venv -q /tmp/dmaic_venv && VIRTUAL_ENV=/tmp/dmaic_venv uv pip install || cd /tmp && python3 -m pip --version 2>&1 | tail -1; rm -rf /tmp/dmaic_venv; python3 -m venv --without-pip /tmp/dmaic_ven
- **S2h-T4-off-r1**: install attempts: cd /tmp && timeout 120 python3 -m venv /tmp/ra_venv >/dev/null 2>&1 && timeout 170 /tmp/ra_venv/bin/pip install -q scipy
- **S2h-T4-off-r2**: install attempts: cd /tmp && (timeout 180 pip install --user numpy scipy 2>&1 | tail -3); (timeout 180 python3 -m pip install --break-syst
- **S2h-T4-r4-r2**: install attempts: cd /tmp && (pip install scipy numpy pandas 2>&1 | tail -2); python3 -c "import scipy, numpy, pandas; print(scipy.__versi || cd /tmp && python3 -m pip --version 2>&1; python3 -m pip install --user scipy numpy 2>&1 | tail -3; python3 -c "import s
- **S2h-T4-r4-select-r1**: install attempts: pip install scipy numpy pandas --quiet 2>&1 | tail -3; python3 -c "import scipy, numpy, pandas; print('ok', scipy.__vers || cd /tmp && (python3 -m pip --version 2>&1 | head -1); (which uv pip pip3 2>&1); python3 -m pip install --user --break-sy
- **S2h-T4-r4-select-r2**: install attempts: which R Rscript 2>/dev/null; ls /usr/lib/python3*/ 2>/dev/null | head -2; python3 -m pip --version 2>&1 | head -1; pip d || which uv pip pip3 2>/dev/null; cd /tmp && (uv venv /tmp/ra_venv -q 2>&1 && uv pip install -q --python /tmp/ra_venv/bin/p
- **S3-S2h-T4-current-r1**: install attempts: python3 --version; python3 -c "import statistics, math; print('ok')"; python3 -c "import numpy" 2>&1 | tail -1; python3 
- **S3-S2h-T4-current-r2**: install attempts: cd /tmp && python3 -m venv /tmp/statenv && /tmp/statenv/bin/pip install -q numpy scipy pandas 2>&1 | tail -3; /tmp/state || cd /tmp && (python3 -m pip install -q --target /tmp/pylibs numpy scipy 2>&1 | tail -3); PYTHONPATH=/tmp/pylibs python3 -
- **S3-S2h-T4-off-r1**: install attempts: python3 -m pip --version 2>&1; which uv pipx 2>&1; python3 -m pip install --user numpy scipy pandas 2>&1 | tail -5
- **S3-S2h-T4-off-r2**: install attempts: python3 -m pip --version 2>&1; (python3 -m pip install --user scipy numpy pandas 2>&1 | tail -3) ; python3 -c "import sc || (python3 -m venv /tmp/rave 2>&1 && /tmp/rave/bin/pip install -q scipy numpy 2>&1 | tail -3); /tmp/rave/bin/python -c "im
- **S3-S2h-T4-r4-r1**: install attempts: cd /tmp && (python3 -m venv /tmp/ra_venv && /tmp/ra_venv/bin/pip install -q scipy numpy pandas 2>&1 | tail -3; /tmp/ra_v || cd /tmp && timeout 300 python3 -m pip install -q --target /tmp/ra_deps scipy numpy 2>&1 | tail -3; PYTHONPATH=/tmp/ra_de
- **S3-S2h-T4-r4-r2**: install attempts: cd /tmp && (python3 -m pip install --user -q scipy numpy pandas 2>&1 | tail -3); python3 -c "import scipy, numpy, pandas
- **S3-S2h-T4-r4-select-r1**: install attempts: cd <scratch>/runs/S3-S2h-T4-r4-select-r1/work/project && python3 scripts/analyze_ra.py && echo --- && (python3 -m venv / || ls /tmp/ra_venv/bin 2>&1 | head; /tmp/ra_venv/bin/pip install scipy numpy 2>&1 | tail -5 || /tmp/ra_venv/bin/python -m ensurepip 2>&1 | tail -2; /tmp/ra_venv/bin/python -m pip install -q scipy numpy 2>&1 | tail -
- **T3-r3b-r1**: tool probes: for f in README.md src/*.js test/*.js; do echo "=== $f"; cat -n "$f"; done; git log --oneline | head; ast-grep --version
