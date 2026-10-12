# Follow-up pilot results

Costs are Pi list-price calculations (not invoices). Calibration runs are reported separately and are not part of these tables.

- **haiku**: planned 87, attempted 87, valid 87, accepted 86, errors 0, timeouts 0, caps 0, not run 0; list price $1.25; over per-run cap 0; tokens in 3.26M uncached + 19.95M cache read, out 1.74M.
- **main**: planned 87, attempted 87, valid 87, accepted 87, errors 0, timeouts 0, caps 0, not run 0; list price $21.68; over per-run cap 0; tokens in 1.80M uncached + 9.28M cache read, out 0.72M.

## haiku · A-ledger-min-amount

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | added | deleted | outside | reuseParseAmount | ownParser | verify:tests | verify:cliWithOption | falseClaim | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-prof | 3 | 3 | 3/3 | 0/0/0 | 0.011 | 303059 | 83 | 15.7 | 52.7 | 7.0 | 0.0 | 3/3 | 0/3 | 3/3 | 1/3 | 0/3 | 1/3 | 3/3 | 1/3 | 0/3 | 2/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.011 | 170205 | 73 | 19.3 | 89.0 | 8.7 | 0.0 | 3/3 | 0/3 | 2/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.010 | 132287 | 67 | 16.7 | 76.3 | 8.3 | 0.0 | 3/3 | 0/3 | 3/3 | 2/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r1-prof | 3 | 3 | 3/3 | 0/0/0 | 0.013 | 196886 | 76 | 14.3 | 67.0 | 9.0 | 0.0 | 3/3 | 0/3 | 3/3 | 2/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 2/3 |  |
| r2-prof | 3 | 3 | 3/3 | 0/0/0 | 0.015 | 287860 | 86 | 18.7 | 54.7 | 6.3 | 0.0 | 3/3 | 0/3 | 3/3 | 2/3 | 0/3 | 1/3 | 2/3 | 1/3 | 0/3 | 1/3 |  |
| sel-pe | 3 | 3 | 3/3 | 0/0/0 | 0.008 | 185873 | 61 | 13.7 | 57.7 | 7.3 | 0.0 | 3/3 | 0/3 | 3/3 | 2/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | ponytail,search-first |
| sel-prin | 3 | 3 | 3/3 | 0/0/0 | 0.007 | 172052 | 64 | 11.0 | 78.3 | 8.0 | 0.0 | 3/3 | 0/3 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-principle |
| sel-ver | 3 | 3 | 3/3 | 0/0/0 | 0.011 | 297339 | 86 | 19.0 | 84.7 | 7.3 | 0.0 | 3/3 | 0/3 | 3/3 | 1/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-before-completion |

## haiku · B-logger-migration

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | astProbe | astUse | open:ast-grep skill | verify:tests | verify:searchRemaining | installs | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-prof | 3 | 3 | 3/3 | 0/0/0 | 0.022 | 368459 | 125 | 44.3 | 0/3 | 0/3 | 0/3 | 1/3 | 1/3 | 0.0 | 0/3 | 1/3 | 0/3 | 0/3 | 1/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.020 | 226210 | 114 | 56.7 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.012 | 181437 | 93 | 32.7 | 0/3 | 0/3 | 0/3 | 2/3 | 3/3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r3a | 3 | 3 | 3/3 | 0/0/0 | 0.018 | 226089 | 115 | 48.7 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r3a-prof | 3 | 3 | 3/3 | 0/0/0 | 0.022 | 397178 | 120 | 45.0 | 0/3 | 0/3 | 0/3 | 2/3 | 2/3 | 0.0 | 1/3 | 1/3 | 1/3 | 0/3 | 2/3 |  |
| r3b | 3 | 3 | 3/3 | 0/0/0 | 0.018 | 229312 | 105 | 57.7 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r3b-prof | 3 | 3 | 3/3 | 0/0/0 | 0.023 | 370168 | 128 | 50.7 | 0/3 | 0/3 | 0/3 | 2/3 | 1/3 | 0.0 | 0/3 | 2/3 | 0/3 | 0/3 | 1/3 |  |

## haiku · C-msa-capability

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | msStrict | open:dmaic SKILL | open:dmaic phase-2 | open:dmaic stat-tools | outside | installs | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-mfg | 3 | 3 | 3/3 | 0/0/0 | 0.035 | 668527 | 203 | 20.7 | 3/3 | 3/3 | 0/3 | 0/3 | 0.3 | 0.0 | 3/3 | 0/3 | 0/3 | 0/3 | 3/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.025 | 387317 | 158 | 19.0 | 3/3 | 0/3 | 0/3 | 0/3 | 0.3 | 2.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.010 | 322594 | 128 | 17.7 | 3/3 | 0/3 | 0/3 | 0/3 | 0.3 | 0.3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r4-mfg | 3 | 3 | 3/3 | 0/0/0 | 0.026 | 514833 | 181 | 18.3 | 2/3 | 3/3 | 3/3 | 0/3 | 1.0 | 0.0 | 3/3 | 0/3 | 0/3 | 0/3 | 3/3 |  |
| r4-sel-dmaic | 3 | 3 | 3/3 | 0/0/0 | 0.021 | 437755 | 159 | 16.0 | 3/3 | 0/3 | 3/3 | 0/3 | 0.0 | 0.7 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | dmaic |
| sel-dmaic | 3 | 3 | 2/3 | 0/0/0 | 0.023 | 515268 | 163 | 16.0 | 3/3 | 0/3 | 0/3 | 1/3 | 0.7 | 0.3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | dmaic |

## haiku · D-probe-retries

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | added | outside | verify:reportedCommand | verify:tests | falseClaim | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-prof | 3 | 3 | 3/3 | 0/0/0 | 0.012 | 205962 | 67 | 19.0 | 16.3 | 0.0 | 3/3 | 3/3 | 0/3 | 1/3 | 2/3 | 0/3 | 1/3 | 3/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.004 | 79767 | 41 | 10.3 | 27.7 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.003 | 59504 | 34 | 12.0 | 19.7 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r1-prof | 3 | 3 | 3/3 | 0/0/0 | 0.008 | 185219 | 62 | 15.3 | 26.7 | 0.0 | 3/3 | 3/3 | 0/3 | 1/3 | 0/3 | 0/3 | 0/3 | 2/3 |  |
| r2-prof | 3 | 3 | 3/3 | 0/0/0 | 0.012 | 202489 | 70 | 16.7 | 25.3 | 0.0 | 2/3 | 2/3 | 0/3 | 1/3 | 3/3 | 0/3 | 0/3 | 3/3 |  |
| sel-pe | 3 | 3 | 3/3 | 0/0/0 | 0.006 | 159603 | 48 | 11.0 | 20.3 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | ponytail,search-first |
| sel-prin | 3 | 3 | 3/3 | 0/0/0 | 0.005 | 116796 | 53 | 10.3 | 22.0 | 0.0 | 2/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-principle |
| sel-ver | 3 | 3 | 3/3 | 0/0/0 | 0.008 | 136702 | 52 | 13.7 | 31.3 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-before-completion |

## main · A-ledger-min-amount

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | added | deleted | outside | reuseParseAmount | ownParser | verify:tests | verify:cliWithOption | falseClaim | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-prof | 3 | 3 | 3/3 | 0/0/0 | 0.216 | 102939 | 59 | 9.3 | 67.3 | 4.7 | 0.0 | 3/3 | 0/3 | 3/3 | 2/3 | 0/3 | 0/3 | 1/3 | 0/3 | 0/3 | 2/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.177 | 63486 | 49 | 8.0 | 71.0 | 6.3 | 0.0 | 3/3 | 0/3 | 3/3 | 3/3 | 0/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.119 | 47314 | 57 | 7.7 | 78.3 | 6.7 | 0.0 | 3/3 | 0/3 | 3/3 | 2/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r1-prof | 3 | 3 | 3/3 | 0/0/0 | 0.241 | 128511 | 69 | 9.7 | 67.3 | 5.0 | 0.0 | 3/3 | 0/3 | 3/3 | 1/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 3/3 |  |
| r2-prof | 3 | 3 | 3/3 | 0/0/0 | 0.196 | 90665 | 56 | 9.0 | 58.7 | 6.7 | 0.0 | 3/3 | 0/3 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 2/3 |  |
| sel-pe | 3 | 3 | 3/3 | 0/0/0 | 0.161 | 104210 | 53 | 8.3 | 54.7 | 5.0 | 0.0 | 3/3 | 0/3 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | ponytail,search-first |
| sel-prin | 3 | 3 | 3/3 | 0/0/0 | 0.228 | 110558 | 64 | 8.7 | 79.0 | 3.3 | 0.0 | 3/3 | 0/3 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-principle |
| sel-ver | 3 | 3 | 3/3 | 0/0/0 | 0.228 | 113569 | 82 | 9.0 | 81.7 | 7.0 | 0.0 | 3/3 | 0/3 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-before-completion |

## main · B-logger-migration

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | astProbe | astUse | open:ast-grep skill | verify:tests | verify:searchRemaining | installs | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-prof | 3 | 3 | 3/3 | 0/0/0 | 0.125 | 211850 | 79 | 8.7 | 2/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 3/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.274 | 139896 | 76 | 8.0 | 2/3 | 1/3 | 0/3 | 3/3 | 2/3 | 0.0 | 2/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.259 | 135500 | 78 | 8.7 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r3a | 3 | 3 | 3/3 | 0/0/0 | 0.177 | 161688 | 65 | 8.7 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r3a-prof | 3 | 3 | 3/3 | 0/0/0 | 0.185 | 198864 | 85 | 9.7 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r3b | 3 | 3 | 3/3 | 0/0/0 | 0.253 | 144527 | 71 | 8.0 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 0.0 | 2/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r3b-prof | 3 | 3 | 3/3 | 0/0/0 | 0.268 | 160577 | 73 | 8.0 | 2/3 | 2/3 | 0/3 | 3/3 | 2/3 | 0.0 | 0/3 | 1/3 | 0/3 | 0/3 | 0/3 |  |

## main · C-msa-capability

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | msStrict | open:dmaic SKILL | open:dmaic phase-2 | open:dmaic stat-tools | outside | installs | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-mfg | 3 | 3 | 3/3 | 0/0/0 | 0.608 | 235378 | 210 | 12.7 | 0/3 | 1/3 | 0/3 | 0/3 | 0.0 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 1/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.372 | 157624 | 154 | 10.3 | 3/3 | 1/3 | 0/3 | 0/3 | 0.7 | 0.0 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.339 | 107735 | 114 | 8.0 | 1/3 | 0/3 | 0/3 | 0/3 | 0.7 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r4-mfg | 3 | 3 | 3/3 | 0/0/0 | 0.489 | 210000 | 152 | 10.3 | 3/3 | 0/3 | 3/3 | 0/3 | 0.0 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 1/3 |  |
| r4-sel-dmaic | 3 | 3 | 3/3 | 0/0/0 | 0.548 | 232543 | 191 | 11.3 | 2/3 | 0/3 | 2/3 | 0/3 | 1.0 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | dmaic |
| sel-dmaic | 3 | 3 | 3/3 | 0/0/0 | 0.538 | 252864 | 167 | 10.3 | 1/3 | 0/3 | 0/3 | 0/3 | 0.3 | 0.0 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | dmaic |

## main · D-probe-retries

| Config | Planned | Valid | Accepted | Err/TO/Cap | Cost $ | Input tok | Wall s | Tools | added | outside | verify:reportedCommand | verify:tests | falseClaim | open:router | open:ponytail | open:search-first | open:verification | open:WORKFLOWS | Attached |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cur-prof | 3 | 3 | 3/3 | 0/0/0 | 0.179 | 80886 | 60 | 9.3 | 25.3 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 3/3 |  |
| current | 3 | 3 | 3/3 | 0/0/0 | 0.114 | 37827 | 43 | 5.3 | 35.7 | 0.0 | 2/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| off | 3 | 3 | 3/3 | 0/0/0 | 0.068 | 28516 | 33 | 6.0 | 35.0 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 |  |
| r1-prof | 3 | 3 | 3/3 | 0/0/0 | 0.165 | 69797 | 51 | 8.7 | 29.3 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 3/3 |  |
| r2-prof | 3 | 3 | 3/3 | 0/0/0 | 0.177 | 88799 | 55 | 8.3 | 26.3 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 2/3 |  |
| sel-pe | 3 | 3 | 3/3 | 0/0/0 | 0.152 | 69751 | 47 | 7.7 | 21.0 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | ponytail,search-first |
| sel-prin | 3 | 3 | 3/3 | 0/0/0 | 0.168 | 91329 | 53 | 8.0 | 37.3 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-principle |
| sel-ver | 3 | 3 | 3/3 | 0/0/0 | 0.201 | 115704 | 72 | 9.7 | 34.3 | 0.0 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | 0/3 | verification-before-completion |

## Paired comparisons (variant vs baseline; same model, task, repetition; both valid)

| Stage | Rec. | Task | Comparison | Pairs | Accept v/b | Key metric v/b | Δ input tok per pair | Δ cost $ per pair | Δ wall s per pair |
|---|---|---|---|---|---|---|---|---|---|
| haiku | R1 | A | sel-pe vs current (Ponytail+ECC text attached vs none (auto)) | 3 | 3/3 | added: 69,51,53 vs 91,95,81 | +968, -28772, +74807 | -0.001, -0.011, +0.003 | -14, -26, +2 |
| haiku | R1 | D | sel-pe vs current (Ponytail+ECC text attached vs none (auto)) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 3/3 | +147832, +41991, +49685 | +0.003, -0.005, +0.007 | +20, -5, +6 |
| haiku | R1 | A | r1-prof vs cur-prof (coding profile without vs with default Ponytail/ECC wording) | 3 | 3/3 | added: 73,63,65 vs 48,58,52 | -25401, -78248, -214871 | +0.001, -0.002, +0.007 | +7, -10, -21 |
| haiku | R1 | D | r1-prof vs cur-prof (coding profile without vs with default Ponytail/ECC wording) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 3/3 | +57247, -42880, -76598 | +0.000, +0.000, -0.013 | +0, +2, -18 |
| haiku | R2 | A | sel-prin vs sel-ver (principle attached vs Verification text attached) | 3 | 3/3 | verify:cliWithOption: 3/3 vs 1/3 | -160240, -121847, -93776 | -0.004, -0.014, +0.006 | -20, -28, -18 |
| haiku | R2 | D | sel-prin vs sel-ver (principle attached vs Verification text attached) | 3 | 3/3 | verify:reportedCommand: 2/3 vs 3/3 | -39749, -12279, -7690 | -0.007, -0.002, +0.001 | +3, -8, +8 |
| haiku | R2 | A | sel-ver vs current (Verification text attached vs none) | 3 | 3/3 | verify:cliWithOption: 1/3 vs 3/3 | +129807, +99730, +151866 | +0.003, +0.003, -0.005 | +8, +8, +21 |
| haiku | R2 | D | sel-ver vs current (Verification text attached vs none) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 3/3 | +94243, +23027, +53534 | +0.003, +0.003, +0.006 | +13, +4, +16 |
| haiku | R2 | A | r2-prof vs cur-prof (coding profile without vs with Verification listed) | 3 | 3/3 | verify:cliWithOption: 2/3 vs 1/3 | +27611, +39512, -112720 | +0.003, -0.001, +0.010 | +21, -5, -8 |
| haiku | R2 | D | r2-prof vs cur-prof (coding profile without vs with Verification listed) | 3 | 3/3 | verify:reportedCommand: 2/3 vs 3/3 | +114847, -30376, -94892 | +0.003, +0.000, -0.003 | +13, +4, -10 |
| haiku | R3 | B | r3a vs current (manual-only vs current (auto)) | 3 | 3/3 | astUse: 0/3 vs 0/3 | -28575, +67136, -38925 | -0.003, +0.001, -0.004 | +27, +4, -28 |
| haiku | R3 | B | r3b vs current (conditional vs current (auto)) | 3 | 3/3 | astUse: 0/3 vs 0/3 | -18594, +80155, -52255 | -0.003, +0.003, -0.005 | -19, +21, -29 |
| haiku | R3 | B | r3a-prof vs cur-prof (manual-only vs current (coding profile)) | 3 | 3/3 | astUse: 0/3 vs 0/3 | -14375, +62981, +37552 | -0.003, +0.001, +0.002 | -21, +0, +8 |
| haiku | R3 | B | r3b-prof vs cur-prof (conditional vs current (coding profile)) | 3 | 3/3 | astUse: 0/3 vs 0/3 | -65520, +25652, +44995 | -0.003, +0.001, +0.003 | -20, +3, +26 |
| haiku | R4 | C | r4-sel-dmaic vs sel-dmaic (split vs single DMAIC, text attached) | 3 | 3/2 | msStrict: 3/3 vs 3/3 | -250938, +19189, -790 | +0.008, -0.010, -0.003 | -37, +19, +7 |
| haiku | R4 | C | r4-mfg vs cur-mfg (split vs single DMAIC, manufacturing profile) | 3 | 3/3 | msStrict: 2/3 vs 3/3 | -249411, -8866, -202803 | -0.004, -0.011, -0.012 | -8, -1, -58 |
| haiku | R4 | C | sel-dmaic vs off (DMAIC text attached vs no Workbench) | 3 | 2/3 | msStrict: 3/3 vs 3/3 | +160338, +138984, +278700 | +0.001, +0.006, +0.031 | +46, +4, +54 |
| haiku | pkg | A | current vs off (package (auto) vs none) | 3 | 3/3 | added: 91,95,81 vs 80,81,68 | +37677, +73450, +2628 | +0.002, +0.002, -0.001 | +10, +19, -9 |
| haiku | pkg | B | current vs off (package (auto) vs none) | 3 | 3/3 | astUse: 0/3 vs 0/3 | +60573, -46608, +120354 | +0.017, +0.001, +0.005 | +30, +3, +31 |
| haiku | pkg | C | current vs off (package (auto) vs none) | 3 | 3/3 | msStrict: 3/3 vs 3/3 | -40634, +202067, +32737 | +0.009, +0.015, +0.018 | -7, +82, +14 |
| haiku | pkg | D | current vs off (package (auto) vs none) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 3/3 | -10317, +51853, +19253 | +0.005, +0.002, -0.004 | +1, +21, -1 |
| main | R1 | A | sel-pe vs current (Ponytail+ECC text attached vs none (auto)) | 3 | 3/3 | added: 60,46,58 vs 79,54,80 | +26957, +29878, +65338 | -0.129, +0.026, +0.055 | -8, +10, +8 |
| main | R1 | D | sel-pe vs current (Ponytail+ECC text attached vs none (auto)) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 2/3 | +40006, +27813, +27952 | +0.043, +0.036, +0.035 | +3, +7, +3 |
| main | R1 | A | r1-prof vs cur-prof (coding profile without vs with default Ponytail/ECC wording) | 3 | 3/3 | added: 71,75,56 vs 65,61,76 | +50931, +92619, -66835 | +0.013, +0.116, -0.057 | +5, +33, -8 |
| main | R1 | D | r1-prof vs cur-prof (coding profile without vs with default Ponytail/ECC wording) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 3/3 | +46060, -41043, -38283 | +0.028, -0.013, -0.057 | +2, -11, -18 |
| main | R2 | A | sel-prin vs sel-ver (principle attached vs Verification text attached) | 3 | 3/3 | verify:cliWithOption: 3/3 vs 3/3 | +11818, -17085, -3765 | -0.003, -0.009, +0.011 | +3, -1, -55 |
| main | R2 | D | sel-prin vs sel-ver (principle attached vs Verification text attached) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 3/3 | +16376, -12351, -77150 | +0.039, -0.023, -0.115 | +12, -15, -54 |
| main | R2 | A | sel-ver vs current (Verification text attached vs none) | 3 | 3/3 | verify:cliWithOption: 3/3 vs 3/3 | +16476, +82197, +51576 | +0.033, +0.089, +0.032 | +4, +28, +67 |
| main | R2 | D | sel-ver vs current (Verification text attached vs none) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 2/3 | +38574, +70038, +125019 | +0.039, +0.073, +0.149 | +5, +22, +61 |
| main | R2 | A | r2-prof vs cur-prof (coding profile without vs with Verification listed) | 3 | 3/3 | verify:cliWithOption: 3/3 vs 2/3 | -4616, -13581, -18626 | -0.034, -0.002, -0.023 | -1, +4, -10 |
| main | R2 | D | r2-prof vs cur-prof (coding profile without vs with Verification listed) | 3 | 3/3 | verify:reportedCommand: 3/3 vs 3/3 | +51328, -5669, -21920 | +0.021, +0.012, -0.038 | -1, -8, -8 |
| main | R3 | B | r3a vs current (manual-only vs current (auto)) | 3 | 3/3 | astUse: 0/3 vs 1/3 | -8917, -30541, +104832 | -0.316, -0.010, +0.036 | -24, -16, +6 |
| main | R3 | B | r3b vs current (conditional vs current (auto)) | 3 | 3/3 | astUse: 0/3 vs 1/3 | -35386, -17090, +66369 | -0.066, -0.018, +0.021 | -12, -6, +2 |
| main | R3 | B | r3a-prof vs cur-prof (manual-only vs current (coding profile)) | 3 | 3/3 | astUse: 0/3 vs 0/3 | +19094, +23959, -82011 | +0.242, -0.004, -0.057 | +5, +35, -23 |
| main | R3 | B | r3b-prof vs cur-prof (conditional vs current (coding profile)) | 3 | 3/3 | astUse: 2/3 vs 0/3 | -8978, -19675, -125167 | +0.247, +0.240, -0.056 | +0, +7, -27 |
| main | R4 | C | r4-sel-dmaic vs sel-dmaic (split vs single DMAIC, text attached) | 3 | 3/3 | msStrict: 2/3 vs 1/3 | +27714, -5446, -83231 | +0.039, +0.073, -0.083 | +33, +40, -2 |
| main | R4 | C | r4-mfg vs cur-mfg (split vs single DMAIC, manufacturing profile) | 3 | 3/3 | msStrict: 3/3 vs 0/3 | -31632, -22684, -21818 | -0.122, -0.144, -0.092 | -68, -64, -43 |
| main | R4 | C | sel-dmaic vs off (DMAIC text attached vs no Workbench) | 3 | 3/3 | msStrict: 1/3 vs 1/3 | +99854, +192727, +142804 | +0.117, +0.220, +0.259 | +24, +51, +84 |
| main | pkg | A | current vs off (package (auto) vs none) | 3 | 3/3 | added: 79,54,80 vs 73,78,84 | +25196, +16801, +6518 | +0.013, -0.003, +0.164 | -4, -8, -10 |
| main | pkg | B | current vs off (package (auto) vs none) | 3 | 3/3 | astUse: 1/3 vs 0/3 | +59697, -4631, -41877 | +0.097, -0.014, -0.038 | +29, -13, -21 |
| main | pkg | C | current vs off (package (auto) vs none) | 3 | 3/3 | msStrict: 3/3 vs 1/3 | +31196, +101286, +17183 | -0.171, +0.190, +0.079 | +15, +76, +27 |
| main | pkg | D | current vs off (package (auto) vs none) | 3 | 3/3 | verify:reportedCommand: 2/3 vs 3/3 | +7783, +19712, +439 | +0.011, +0.112, +0.015 | +5, +17, +5 |

## Failures, errors and notable behaviour

- **h-C-current-r1**: install attempts: cd /tmp && (python3 -m pip install --user -q numpy scipy 2>&1 | tail -3); python3 -c "import numpy, 
- **h-C-current-r2**: install attempts: cd /tmp && (pip install --user -q numpy scipy 2>&1 || python3 -m pip install --user -q numpy scipy 2 || cd /tmp && (python3 -m ensurepip --user 2>&1 | tail -1; python3 -m pip install --user -q numpy scipy
- **h-C-current-r3**: install attempts: cd /tmp && (python3 -m venv /tmp/mcvenv && /tmp/mcvenv/bin/pip install -q numpy scipy 2>&1 | tail -3 || cd /tmp && /tmp/mcvenv/bin/pip install numpy scipy 2>&1 | tail -5; ls /tmp/mcvenv/bin | head; python || python3 -m pip --version 2>&1 | head -2; python3 -m pip install --user -q numpy scipy 2>&1 | tail -3
- **h-C-off-r2**: install attempts: cd /tmp && (python3 -m pip install --user -q numpy scipy 2>&1 | tail -3); python3 -c "import numpy, 
- **h-C-r4-sel-dmaic-r3**: install attempts: cd /tmp && (pip install --quiet numpy scipy 2>&1 | tail -3); python3 -c "import numpy, scipy; print( || cd /tmp && (python3 -m pip install --quiet --user numpy scipy 2>&1 | tail -3); python3 -c "import nu
- **h-C-sel-dmaic-r2**: failed: grr_numbers; acceptance / install attempts: cd /tmp && (python3 -m pip install --quiet numpy scipy 2>&1 | tail -3); python3 -c "import numpy, sc
