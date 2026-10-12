# Policy pilot results

Planned runs: 90. Recorded: 90. Missing: none.

Accepted: 90. Not accepted: 0. Aborted (timeout, cap, non-zero exit or error stop): 0. Provider retries: 0.

Total list-price cost: $10.82; total wall time (sum): 90.4 min.

## Per task and configuration (mean over repetitions; accept = passed/runs)

| Model | Task | Config | n | Accept | Visible tests | False pass claim | Cost $ | Input tok | Output tok | Wall s | Tool calls | Lines added | Tests after last edit | CLI after last edit | Install attempts | Tool probes | Workbench files read |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5:high | T1-csv-export | current | 2 | 2/2 | 2/2 | 0 | 0.006 | 84934 | 8395 | 42 | 12 | 56 | 1/2 | 1/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T1-csv-export | off | 2 | 2/2 | 2/2 | 0 | 0.005 | 71744 | 7572 | 41 | 12.5 | 57.5 | 2/2 | 1/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T1-csv-export | r1 | 2 | 2/2 | 2/2 | 0 | 0.005 | 69515 | 6728 | 34 | 10.5 | 58 | 2/2 | 2/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T1-csv-export | r2 | 2 | 2/2 | 2/2 | 0 | 0.006 | 102360 | 7320 | 39 | 14 | 57.5 | 2/2 | 1/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T2-duration-cli | current | 2 | 2/2 | 2/2 | 0 | 0.003 | 73452 | 3314 | 25 | 8 | 9 | 2/2 | 1/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T2-duration-cli | off | 2 | 2/2 | 2/2 | 0 | 0.001 | 79526 | 4122 | 29 | 10 | 10 | 2/2 | 0/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T2-duration-cli | r1 | 2 | 2/2 | 2/2 | 0 | 0.003 | 67481 | 3154 | 25 | 9 | 5.5 | 2/2 | 1/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T2-duration-cli | r2 | 2 | 2/2 | 2/2 | 0 | 0.003 | 83802 | 3232 | 31 | 8.5 | 5.5 | 2/2 | 1/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T3-migrate-calls | current | 2 | 2/2 | 2/2 | 0 | 0.006 | 83553 | 7756 | 47 | 16.5 | 15 | 2/2 | 0/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T3-migrate-calls | off | 2 | 2/2 | 2/2 | 0 | 0.004 | 47276 | 5948 | 31 | 9 | 15 | 2/2 | 0/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T3-migrate-calls | r3a | 2 | 2/2 | 2/2 | 0 | 0.006 | 63206 | 8322 | 38 | 12 | 15 | 2/2 | 0/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T3-migrate-calls | r3b | 2 | 2/2 | 2/2 | 0 | 0.006 | 65738 | 7613 | 37 | 10 | 15 | 2/2 | 0/2 | 0 | 0 | 0 |
| claude-haiku-5-5:high | T4-coolant-decision | current | 2 | 2/2 | 0/0 | 0 | 0.021 | 349049 | 27348 | 127 | 17.5 | 449 | 0/2 | 0/2 | 3 | 0 | 1 |
| claude-haiku-5-5:high | T4-coolant-decision | current-select | 2 | 2/2 | 0/0 | 0 | 0.022 | 467662 | 25599 | 128 | 15 | 549.5 | 0/2 | 0/2 | 3 | 0 | 1 |
| claude-haiku-5-5:high | T4-coolant-decision | off | 2 | 2/2 | 0/0 | 0 | 0.019 | 345672 | 24191 | 121 | 17 | 402 | 0/2 | 0/2 | 2 | 0 | 0 |
| claude-haiku-5-5:high | T4-coolant-decision | r4 | 2 | 2/2 | 0/0 | 0 | 0.017 | 468832 | 25158 | 136 | 17.5 | 486.5 | 0/2 | 0/2 | 2 | 0 | 1.5 |
| claude-haiku-5-5:high | T4-coolant-decision | r4-select | 2 | 2/2 | 0/0 | 0 | 0.025 | 577805 | 28591 | 141 | 20.5 | 520.5 | 0/2 | 0/2 | 4 | 0 | 2.5 |
| claude-opus-5-5:high | T1-csv-export | current | 2 | 2/2 | 2/2 | 0 | 0.118 | 58045 | 3472 | 33 | 8 | 40.5 | 2/2 | 2/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T1-csv-export | current-profile | 2 | 2/2 | 2/2 | 0 | 0.144 | 72540 | 3790 | 34 | 7.5 | 40.5 | 2/2 | 2/2 | 0 | 0 | 0.5 |
| claude-opus-5-5:high | T1-csv-export | off | 2 | 2/2 | 2/2 | 0 | 0.058 | 27314 | 3484 | 32 | 7.5 | 55 | 2/2 | 2/2 | 0 | 0 | 0 |
| claude-opus-5-5:high | T1-csv-export | r1 | 2 | 2/2 | 2/2 | 0 | 0.122 | 53936 | 3736 | 34 | 8 | 44 | 2/2 | 2/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T1-csv-export | r1-profile | 2 | 2/2 | 2/2 | 0 | 0.123 | 56532 | 3388 | 32 | 6 | 41 | 2/2 | 2/2 | 0 | 0 | 0.5 |
| claude-opus-5-5:high | T1-csv-export | r2 | 2 | 2/2 | 2/2 | 0 | 0.123 | 53708 | 3768 | 33 | 8 | 45 | 2/2 | 2/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T1-csv-export | r2-profile | 2 | 2/2 | 2/2 | 0 | 0.144 | 74247 | 3850 | 36 | 8.5 | 34 | 2/2 | 2/2 | 0 | 0 | 1.5 |
| claude-opus-5-5:high | T2-duration-cli | current | 2 | 2/2 | 2/2 | 0 | 0.106 | 60495 | 2528 | 26 | 8 | 16.5 | 2/2 | 2/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T2-duration-cli | current-profile | 2 | 2/2 | 2/2 | 0 | 0.086 | 81082 | 3398 | 37 | 9.5 | 13 | 2/2 | 2/2 | 0 | 0 | 1.5 |
| claude-opus-5-5:high | T2-duration-cli | off | 2 | 2/2 | 2/2 | 0 | 0.069 | 26484 | 2068 | 21 | 6 | 14.5 | 2/2 | 2/2 | 0 | 0 | 0 |
| claude-opus-5-5:high | T2-duration-cli | r1 | 2 | 2/2 | 2/2 | 0 | 0.100 | 46905 | 2504 | 25 | 7 | 17 | 2/2 | 2/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T2-duration-cli | r1-profile | 2 | 2/2 | 2/2 | 0 | 0.114 | 58744 | 2538 | 24 | 6.5 | 13.5 | 2/2 | 2/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T2-duration-cli | r2 | 2 | 2/2 | 2/2 | 0 | 0.099 | 46659 | 2469 | 24 | 7 | 14 | 2/2 | 2/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T2-duration-cli | r2-profile | 2 | 2/2 | 2/2 | 0 | 0.132 | 69661 | 3016 | 29 | 8 | 11.5 | 2/2 | 2/2 | 0 | 0 | 1.5 |
| claude-opus-5-5:high | T3-migrate-calls | current | 2 | 2/2 | 2/2 | 0 | 0.143 | 57398 | 4573 | 48 | 9 | 15 | 2/2 | 0/2 | 0 | 0 | 0.5 |
| claude-opus-5-5:high | T3-migrate-calls | current-profile | 2 | 2/2 | 2/2 | 0 | 0.159 | 65466 | 4418 | 46 | 6 | 15 | 2/2 | 0/2 | 0 | 0 | 2 |
| claude-opus-5-5:high | T3-migrate-calls | off | 2 | 2/2 | 2/2 | 0 | 0.110 | 29767 | 3742 | 38 | 5.5 | 15 | 2/2 | 0/2 | 0 | 0 | 0 |
| claude-opus-5-5:high | T3-migrate-calls | r3a | 2 | 2/2 | 2/2 | 0 | 0.076 | 41862 | 4002 | 43 | 8 | 15 | 2/2 | 0/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T3-migrate-calls | r3a-profile | 2 | 2/2 | 2/2 | 0 | 0.165 | 75021 | 4938 | 46 | 8.5 | 15 | 2/2 | 0/2 | 0 | 0 | 0 |
| claude-opus-5-5:high | T3-migrate-calls | r3b | 2 | 2/2 | 2/2 | 0 | 0.083 | 51367 | 4430 | 41 | 8 | 15 | 2/2 | 0/2 | 0 | 1 | 1 |
| claude-opus-5-5:high | T3-migrate-calls | r3b-profile | 2 | 2/2 | 2/2 | 0 | 0.088 | 78662 | 4308 | 41 | 8.5 | 15 | 2/2 | 0/2 | 0 | 0 | 0.5 |
| claude-opus-5-5:high | T4-coolant-decision | current | 2 | 2/2 | 0/0 | 0 | 0.353 | 131038 | 12493 | 117 | 11.5 | 343 | 0/2 | 0/2 | 0 | 0 | 1.5 |
| claude-opus-5-5:high | T4-coolant-decision | current-mfg | 2 | 2/2 | 0/0 | 0 | 0.475 | 234653 | 15374 | 144 | 13.5 | 545 | 0/2 | 0/2 | 0 | 0 | 1.5 |
| claude-opus-5-5:high | T4-coolant-decision | current-select | 2 | 2/2 | 0/0 | 0 | 0.530 | 361196 | 15067 | 142 | 13 | 355.5 | 0/2 | 0/2 | 0 | 0 | 2 |
| claude-opus-5-5:high | T4-coolant-decision | off | 2 | 2/2 | 0/0 | 0 | 0.336 | 126994 | 12190 | 119 | 11.5 | 407.5 | 0/2 | 0/2 | 0 | 0 | 0 |
| claude-opus-5-5:high | T4-coolant-decision | r4 | 2 | 2/2 | 0/0 | 0 | 0.232 | 127230 | 12752 | 122 | 10 | 312.5 | 0/2 | 0/2 | 0 | 0 | 1 |
| claude-opus-5-5:high | T4-coolant-decision | r4-mfg | 2 | 2/2 | 0/0 | 0 | 0.475 | 286400 | 14770 | 138 | 14 | 428.5 | 0/2 | 0/2 | 0 | 0 | 1.5 |
| claude-opus-5-5:high | T4-coolant-decision | r4-select | 2 | 2/2 | 0/0 | 0 | 0.486 | 279387 | 14866 | 140 | 12 | 408.5 | 0/2 | 0/2 | 0 | 0 | 2 |

## Paired differences against the matching baseline (same model, task, repetition and exposure mode; variant − baseline)

| Model | Task | Variant | Pairs | Accept (variant vs baseline) | Δ cost $ per pair | Δ input tokens per pair | Δ wall s per pair | Δ tool calls per pair | Δ lines added per pair |
|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-5-5:high | T1-csv-export | r1 vs current | 2 | 2/2 vs 2/2 | -0.000, -0.002 | -11663, -19175 | -2, -15 | -1, -2 | +12, -8 |
| claude-haiku-5-5:high | T1-csv-export | r2 vs current | 2 | 2/2 vs 2/2 | -0.000, -0.001 | +21867, +12985 | +0, -6 | +2, +2 | +13, -10 |
| claude-haiku-5-5:high | T2-duration-cli | r1 vs current | 2 | 2/2 vs 2/2 | -0.001, +0.000 | -10950, -992 | -4, +2 | +0, +2 | -7, +0 |
| claude-haiku-5-5:high | T2-duration-cli | r2 vs current | 2 | 2/2 vs 2/2 | -0.000, +0.000 | +11862, +8838 | -1, +12 | +1, +0 | -7, +0 |
| claude-haiku-5-5:high | T3-migrate-calls | r3a vs current | 2 | 2/2 vs 2/2 | -0.001, +0.001 | -33617, -7076 | -19, +1 | -7, -2 | +0, +0 |
| claude-haiku-5-5:high | T3-migrate-calls | r3b vs current | 2 | 2/2 vs 2/2 | -0.001, +0.000 | -27367, -8262 | -17, -3 | -13, +0 | +0, +0 |
| claude-haiku-5-5:high | T4-coolant-decision | r4 vs current | 2 | 2/2 vs 2/2 | +0.003, -0.010 | +231242, +8324 | +22, -5 | +5, -5 | +115, -40 |
| claude-haiku-5-5:high | T4-coolant-decision | r4-select vs current-select | 2 | 2/2 vs 2/2 | -0.001, +0.009 | +21540, +198747 | -14, +40 | +1, +10 | -87, +29 |
| claude-opus-5-5:high | T1-csv-export | r1 vs current | 2 | 2/2 vs 2/2 | +0.008, +0.001 | +730, -8949 | +4, -4 | +0, +0 | +8, -1 |
| claude-opus-5-5:high | T1-csv-export | r1-profile vs current-profile | 2 | 2/2 vs 2/2 | -0.031, -0.011 | -22398, -9618 | -5, -0 | -3, +0 | +1, +0 |
| claude-opus-5-5:high | T1-csv-export | r2 vs current | 2 | 2/2 vs 2/2 | +0.010, +0.000 | +981, -9655 | +4, -4 | +0, +0 | +3, +6 |
| claude-opus-5-5:high | T1-csv-export | r2-profile vs current-profile | 2 | 2/2 vs 2/2 | -0.004, +0.003 | +8608, -5194 | -1, +3 | +0, +2 | -7, -6 |
| claude-opus-5-5:high | T2-duration-cli | r1 vs current | 2 | 2/2 vs 2/2 | -0.014, +0.003 | -26997, -183 | -3, +2 | -2, +0 | +4, -3 |
| claude-opus-5-5:high | T2-duration-cli | r1-profile vs current-profile | 2 | 2/2 vs 2/2 | +0.084, -0.028 | -24083, -20593 | -9, -16 | -5, -1 | +1, +0 |
| claude-opus-5-5:high | T2-duration-cli | r2 vs current | 2 | 2/2 vs 2/2 | -0.014, +0.002 | -27106, -566 | -5, +1 | -2, +0 | +0, -5 |
| claude-opus-5-5:high | T2-duration-cli | r2-profile vs current-profile | 2 | 2/2 vs 2/2 | +0.102, -0.011 | -22304, -537 | -4, -11 | -2, -1 | -1, -2 |
| claude-opus-5-5:high | T3-migrate-calls | r3a vs current | 2 | 2/2 vs 2/2 | -0.115, -0.020 | -16233, -14837 | -15, +4 | -1, -1 | +0, +0 |
| claude-opus-5-5:high | T3-migrate-calls | r3a-profile vs current-profile | 2 | 2/2 vs 2/2 | +0.004, +0.009 | -4925, +24036 | +2, -2 | +0, +5 | +0, +0 |
| claude-opus-5-5:high | T3-migrate-calls | r3b vs current | 2 | 2/2 vs 2/2 | -0.116, -0.004 | -5895, -6166 | -11, -3 | -1, -1 | +0, +0 |
| claude-opus-5-5:high | T3-migrate-calls | r3b-profile vs current-profile | 2 | 2/2 vs 2/2 | -0.140, -0.002 | +10985, +15407 | -2, -9 | +1, +4 | +0, +0 |
| claude-opus-5-5:high | T4-coolant-decision | r4 vs current | 2 | 2/2 vs 2/2 | -0.263, +0.021 | -28639, +21024 | +3, +7 | -3, +0 | -2, -59 |
| claude-opus-5-5:high | T4-coolant-decision | r4-mfg vs current-mfg | 2 | 2/2 vs 2/2 | -0.103, +0.102 | -72225, +175720 | -36, +24 | -4, +5 | -211, -22 |
| claude-opus-5-5:high | T4-coolant-decision | r4-select vs current-select | 2 | 2/2 vs 2/2 | -0.198, +0.110 | -292523, +128906 | -44, +38 | -4, +2 | +63, +43 |

## Off vs current (package effect on the same tasks)

| Model | Task | Pairs | Accept (current vs off) | Δ cost $ per pair (current − off) | Δ input tokens | Δ wall s |
|---|---|---|---|---|---|---|
| claude-haiku-5-5:high | T1-csv-export | 2 | 2/2 vs 2/2 | -0.000, +0.002 | -8483, +34862 | -8, +10 |
| claude-haiku-5-5:high | T2-duration-cli | 2 | 2/2 vs 2/2 | +0.003, +0.002 | -7183, -4964 | -1, -6 |
| claude-haiku-5-5:high | T3-migrate-calls | 2 | 2/2 vs 2/2 | +0.002, +0.001 | +40088, +32466 | +23, +9 |
| claude-haiku-5-5:high | T4-coolant-decision | 2 | 2/2 vs 2/2 | +0.003, +0.002 | +48174, -41421 | +2, +10 |
| claude-opus-5-5:high | T1-csv-export | 2 | 2/2 vs 2/2 | +0.101, +0.019 | +30200, +31261 | -1, +4 |
| claude-opus-5-5:high | T2-duration-cli | 2 | 2/2 vs 2/2 | +0.043, +0.029 | +47448, +20573 | +7, +2 |
| claude-opus-5-5:high | T3-migrate-calls | 2 | 2/2 vs 2/2 | +0.008, +0.057 | +20500, +34761 | +6, +15 |
| claude-opus-5-5:high | T4-coolant-decision | 2 | 2/2 vs 2/2 | +0.077, -0.041 | +30338, -22251 | +12, -15 |

## Workbench files read per run (exposure)

| Run | Files |
|---|---|
| T1-current-r1 | skills/wb-coding/SKILL.md |
| S2h-T1-current-r1 | (none) |
| T1-current-r2 | skills/wb-coding/SKILL.md |
| S2h-T1-current-r2 | (none) |
| S2-T1-current-profile-r1 | vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T1-current-profile-r2 | (none) |
| T1-r1-r1 | skills/wb-coding/SKILL.md |
| S2h-T1-r1-r1 | (none) |
| T1-r1-r2 | skills/wb-coding/SKILL.md |
| S2h-T1-r1-r2 | (none) |
| S2-T1-r1-profile-r1 | docs/WORKFLOWS.ko.md |
| S2-T1-r1-profile-r2 | (none) |
| T1-r2-r1 | skills/wb-coding/SKILL.md |
| S2h-T1-r2-r1 | (none) |
| T1-r2-r2 | skills/wb-coding/SKILL.md |
| S2h-T1-r2-r2 | (none) |
| S2-T1-r2-profile-r1 | docs/WORKFLOWS.ko.md |
| S2-T1-r2-profile-r2 | docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| T2-current-r1 | skills/wb-coding/SKILL.md |
| S2h-T2-current-r1 | (none) |
| T2-current-r2 | skills/wb-coding/SKILL.md |
| S2h-T2-current-r2 | (none) |
| S2-T2-current-profile-r1 | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T2-current-profile-r2 | (none) |
| T2-r1-r1 | skills/wb-coding/SKILL.md |
| S2h-T2-r1-r1 | (none) |
| T2-r1-r2 | skills/wb-coding/SKILL.md |
| S2h-T2-r1-r2 | (none) |
| S2-T2-r1-profile-r1 | docs/WORKFLOWS.ko.md |
| S2-T2-r1-profile-r2 | docs/WORKFLOWS.ko.md |
| T2-r2-r1 | skills/wb-coding/SKILL.md |
| S2h-T2-r2-r1 | (none) |
| T2-r2-r2 | skills/wb-coding/SKILL.md |
| S2h-T2-r2-r2 | (none) |
| S2-T2-r2-profile-r1 | docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T2-r2-profile-r2 | docs/WORKFLOWS.ko.md |
| T3-current-r1 | (none) |
| S2h-T3-current-r1 | (none) |
| T3-current-r2 | skills/wb-coding/SKILL.md |
| S2h-T3-current-r2 | (none) |
| S2-T3-current-profile-r1 | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/ponytail/skills/ponytail/SKILL.md |
| S2-T3-current-profile-r2 | docs/WORKFLOWS.ko.md |
| T3-r3a-r1 | skills/wb-coding/SKILL.md |
| S2h-T3-r3a-r1 | (none) |
| T3-r3a-r2 | skills/wb-coding/SKILL.md |
| S2h-T3-r3a-r2 | (none) |
| S2-T3-r3a-profile-r1 | (none) |
| S2-T3-r3a-profile-r2 | (none) |
| T3-r3b-r1 | skills/wb-coding/SKILL.md |
| S2h-T3-r3b-r1 | (none) |
| T3-r3b-r2 | skills/wb-coding/SKILL.md |
| S2h-T3-r3b-r2 | (none) |
| S2-T3-r3b-profile-r1 | docs/WORKFLOWS.ko.md |
| S2-T3-r3b-profile-r2 | (none) |
| T4-current-r1 | docs/WORKFLOWS.ko.md<br>skills/wb-manufacturing/SKILL.md |
| S2h-T4-current-r1 | skills/wb-manufacturing/SKILL.md |
| T4-current-r2 | skills/wb-manufacturing/SKILL.md |
| S2h-T4-current-r2 | skills/wb-manufacturing/SKILL.md |
| S2-T4-current-mfg-r1 | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/SKILL.md |
| S2-T4-current-mfg-r2 | (none) |
| T4-current-select-r1 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| S2h-T4-current-select-r1 | docs/ADAPTERS.md |
| T4-current-select-r2 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| S2h-T4-current-select-r2 | docs/ADAPTERS.md |
| T4-r4-r1 | skills/wb-manufacturing/SKILL.md |
| S2h-T4-r4-r1 | docs/WORKFLOWS.ko.md<br>skills/wb-manufacturing/SKILL.md |
| T4-r4-r2 | skills/wb-manufacturing/SKILL.md |
| S2h-T4-r4-r2 | skills/wb-manufacturing/SKILL.md |
| S2-T4-r4-mfg-r1 | docs/ADAPTERS.md<br>docs/WORKFLOWS.ko.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/SKILL.md |
| S2-T4-r4-mfg-r2 | (none) |
| T4-r4-select-r1 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/phase-2-measure.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/phase-3-analyze.md |
| S2h-T4-r4-select-r1 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |
| T4-r4-select-r2 | docs/ADAPTERS.md |
| S2h-T4-r4-select-r2 | docs/ADAPTERS.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/phase-3-analyze.md<br>vendor/quality-engineering/skills/problem-solving/dmaic/references/statistical-tools.md |

## Failed checks, aborts and notable behaviour

- **T3-r3b-r1**: tool probes: for f in README.md src/*.js test/*.js; do echo "=== $f"; cat -n "$f"; done; git log --oneline | head; ast-grep --version
- **S2h-T4-current-r1**: install attempts: cd /tmp && (python3 -c "import mpmath; print('mpmath', mpmath.__version__)" 2>&1 | tail -1); (timeout 60 pip install --q || cd /tmp && (python3 -m pip --version 2>&1; python3 -m venv /tmp/ra_venv 2>&1 | tail -2 && /tmp/ra_venv/bin/pip install -
- **S2h-T4-current-r2**: install attempts: cd <scratch>/runs/S2h-T4-current-r2/work/project; cat README.md; echo ---; git log --oneline | head; git status --short;
- **S2h-T4-current-select-r1**: install attempts: cd /tmp && python3 -m venv /tmp/dmaic_venv 2>&1 | tail -3 && /tmp/dmaic_venv/bin/pip install -q scipy numpy 2>&1 | tail  || cd /tmp && rm -rf /tmp/dmaic_venv; (which uv && uv venv -q /tmp/dmaic_venv && VIRTUAL_ENV=/tmp/dmaic_venv uv pip install || cd /tmp && python3 -m pip --version 2>&1 | tail -1; rm -rf /tmp/dmaic_venv; python3 -m venv --without-pip /tmp/dmaic_ven
- **S2h-T4-off-r1**: install attempts: cd /tmp && timeout 120 python3 -m venv /tmp/ra_venv >/dev/null 2>&1 && timeout 170 /tmp/ra_venv/bin/pip install -q scipy
- **S2h-T4-off-r2**: install attempts: cd /tmp && (timeout 180 pip install --user numpy scipy 2>&1 | tail -3); (timeout 180 python3 -m pip install --break-syst
- **S2h-T4-r4-r2**: install attempts: cd /tmp && (pip install scipy numpy pandas 2>&1 | tail -2); python3 -c "import scipy, numpy, pandas; print(scipy.__versi || cd /tmp && python3 -m pip --version 2>&1; python3 -m pip install --user scipy numpy 2>&1 | tail -3; python3 -c "import s
- **S2h-T4-r4-select-r1**: install attempts: pip install scipy numpy pandas --quiet 2>&1 | tail -3; python3 -c "import scipy, numpy, pandas; print('ok', scipy.__vers || cd /tmp && (python3 -m pip --version 2>&1 | head -1); (which uv pip pip3 2>&1); python3 -m pip install --user --break-sy
- **S2h-T4-r4-select-r2**: install attempts: which R Rscript 2>/dev/null; ls /usr/lib/python3*/ 2>/dev/null | head -2; python3 -m pip --version 2>&1 | head -1; pip d || which uv pip pip3 2>/dev/null; cd /tmp && (uv venv /tmp/ra_venv -q 2>&1 && uv pip install -q --python /tmp/ra_venv/bin/p
