# Validation record — 0.1.0

Validated on 2026-10-11 using Node.js 24.19.0 and Python 3.12 in an isolated build environment. No user Pi settings were changed.

| Check | Result and scope |
|---|---|
| Actual Pi host | `@earendil-works/pi-coding-agent` 1.1.0, installed separately from this package |
| Package discovery | Pi's actual `DefaultResourceLoader`, in-memory package registration, isolated project/agent directories |
| Extension | Exactly one `workbench` command and a `before_agent_start` handler; zero extension errors |
| Native skills | Exactly seven `wb-*` routing skills, zero skill diagnostics; original vendor skills are not indiscriminately exposed |
| Runtime behavior | 12 Node tests cover state/branches, one-request queueing, command errors, source preservation, path/symlink boundaries, Pi/OMP prompt shapes, and doctor secrecy/absence of execution |
| Original sources | 353 vendored files, including 3 byte-identical compatibility aliases; 27 selectable skills across 21 source repositories |
| Integrity | Git blob SHA and SHA-256 verification for every tracked vendor file, plus license presence and local Markdown reference checks |
| UI UX Pro Max | Bundled Python search runs against bundled CSV data; `SaaS`, product domain, returns two results; unsupported generic query can legitimately return zero |
| Package round trip | The distributable archive is extracted into a fresh directory and checked again before delivery |

The three compatibility aliases address upstream links in Vercel's compiled `AGENTS.md` that point beside the document instead of into `rules/`. The aliased files are unchanged; aliases are exact copies whose provenance is recorded with `aliasOf` in `vendor-integrity.json`.

## Changes after 0.1.0 (unreleased, validated 2026-10-12)

Node.js 24.21.0 and `@earendil-works/pi-coding-agent` 1.1.0. The package archive round trip was not repeated.

| Check | Result and scope |
|---|---|
| `node scripts/check.mjs` | Passes; now also fails on a skill whose `profiles` differ from the profiles that list it, or that names an unknown profile (both confirmed to fail on a modified copy) |
| `node --test tests/runtime.test.mjs` | 26 tests (stub host). Profile guidance: one current copy per request built from the branch (legacy stored guidance and command output dropped, other messages and one-shot skills kept), auto/off, OMP fallback. One-shot selection: put in front of the next user input (idle, steering, follow-up, extension-submitted) as a Pi skill block with images left to the host, never again later; wording tied to its placement; once per skill, several in selection order, `cancel [id]`, status; dropped with a notice by a branch change, reload, new session, resume or fork (silent on quit); a SKILL.md read still in progress is discarded after cancel, branch change or reload and awaited by a request that arrives meanwhile; `/skill:`/template requests: idle ones get the selection right after them, queued ones cancel it, unstarted ones drop it. Command output: session records with a notification fallback outside the TUI, width-safe renderers (Korean text, 8–160 columns). `/workbench` argument completion including `cancel` and pending ids, and the forced-Tab wrapper (both gates, other commands and lines delegated, renamed command). doctor |
| `tests/pi-loader.mjs` with Pi 1.1.0 | One extension with `input`, `context`, `before_agent_start`, `session_start`, `session_tree` and `session_shutdown` handlers, the command-output entry renderer and the one-shot message renderer; seven routing skills, zero diagnostics; the loaded `/workbench` completion callback returns catalog candidates |
| Umbrella `scripts/command-completions.test.mjs` with Pi 1.1.0 | 2 tests. Pi's `CombinedAutocompleteProvider` suggests and applies `/workbench use co` → `/workbench use coding`, `list ga` → `list game`, `skill ponytail-r` → `skill ponytail-review`, and offers nothing for finished or invalid arguments. Forced Tab through the wrapper the bundle-loaded Workbench registers from its session start: Workbench candidates after `/workbench `, `use `, `skill `, `list ` (Pi alone: its file gate declines, or the project's files), nothing after finished or unknown arguments, `use coding` applied; other commands, plain-text file paths and completion while typing equal Pi's own |
| `tests/pi-session.mjs` with Pi 1.1.0 | Real `AgentSession`s with this package and a scripted faux model (11 sessions). One profile guidance per request over three requests, a branch switch, a reload and auto/off; no Workbench profile message stored. An idle selection, then another extension's `triggerTurn` run (follow-up and steer delivery) and the user's follow-up or steering message typed during it: the selection is in that message, not in the extension's run and not in the later request (the previous runtime, d4b72cc, put it into the later request instead). Once per skill, cancel one or all, status. `/reload` and a branch change drop a pending selection with a notice; a cancelled branch change keeps it. An idle `/skill:` request gets the selection right after it, rendered collapsed. A queued `/skill:` command (follow-up) and a queued prompt template with `$@` (steer and follow-up) reach the model as Pi expanded them, the selection is cancelled with a notice, and no later request carries it. list/status records are absent from model requests, render within 30 and 100 columns and are listed again from the reopened session file; a session with commands only leaves no file |
| `tests/pi-editor.mjs` with Pi 1.1.0 | Pi's text editor (pi-tui `Editor`) with the command list built as Pi's interactive mode builds it and the wrapper the extension registers through `bindExtensions`. With the list closed, Tab after `/workbench `, `use `, `skill `, `list ` and `cancel ` shows Workbench candidates (Pi alone: nothing, or the project's files); typing → list → Tab → Enter; Enter applies an argument without submitting and the next Enter submits; `skill ponytail` stays exact next to `ponytail-review`; a single candidate is applied by Tab; the whole argument is replaced; finished or unknown arguments offer nothing; `/model` and file completion are unchanged. No terminal is drawn |
| Pi 1.1.0 CLI, isolated `PI_CODING_AGENT_DIR`, `-e index.js --no-session` | `/workbench status`: text print mode (`-p`) prints nothing (exit 0); `--mode json` emits an `entry_appended` event with the record; `--mode rpc` emits `entry_appended` and an `extension_ui_request` `notify` with the same text |

Not verified: a terminal TUI session on screen (the transcript renderers and Tab are checked through Pi's own components and `Editor` without drawing a terminal), OMP, model behaviour with real providers, and compaction summaries created before this change (they are not rewritten).

## Pi 1.2.0 (unreleased, validated 2026-10-13)

Pi 1.2.0 emits `before_agent_start` also for a run that another extension's `triggerTurn` message starts while idle (`messageType: "custom"`). A selection that an idle `/skill:` or template request took but that never started (no model, its input handled by another extension) was attached to such a run with the notice "이 사용자 요청 바로 뒤에 붙였습니다" (reproduced with `tests/pi-session.mjs` 5c on Pi 1.2.0 before the change). Now that run cancels it with the existing "요청이 시작되지 않아" notice and attaches nothing; selections no user request has taken yet keep waiting; an event without `messageType` (older Pi, OMP) is a user run as before. Node.js 24.21.0; hosts: the global `@earendil-works/pi-coding-agent` 1.2.0 and, for the older-host path, 1.1.0 from a sibling `node_modules`.

| Check | Result and scope |
|---|---|
| `node --test tests/runtime.test.mjs` | 27 tests (stub host), new: "a run another extension's message starts … takes no selection" (unstarted `/skill:` and template requests cancelled at a custom start, with one notice over repeated custom runs, and never passed on, re-selection taken once, pending selections kept through custom runs, a deferred and a pending selection together (only the deferred one cancelled, the pending one with the next user request once), an expanded request's own user run still gets it once, OMP profile fallback kept). It fails on the previous runtime |
| `tests/pi-session.mjs` with Pi 1.2.0 and with Pi 1.1.0 | 13 real sessions. 5c: no model, or the input handled by another extension, then another extension's `triggerTurn` run and the next user request: the run gets no selection and no one-shot message is stored, the cancellation notice is shown, a selection made meanwhile goes with the next request once, the cancelled one with none. On Pi 1.1.0 (no custom `before_agent_start`) the cancellation comes with the next input, as before |
| `tests/pi-loader.mjs`, `tests/pi-editor.mjs` with Pi 1.2.0 | Pass: one extension, seven routing skills, zero diagnostics and extension errors; forced Tab unchanged |
| Interactive TUI of the Pi 1.2.0 CLI in a pseudo-terminal with a real model (CLIProxyAPI `claude-haiku-4-5-20251001`), this checkout's umbrella package and a test-only extension, isolated agent dir | `/workbench skill ponytail-review`, an idle `/skill:` request the test extension handles (no run), `/workbench skill search-first`, then the test extension's `triggerTurn` message: that run (`messageType: "custom"`) got no selection and the model answered; the cancellation notice for ponytail-review was shown; the next typed request got search-first once (the session file has one skill block, none for ponytail-review); `/workbench status` showed nothing pending. The driver is a scratch script, not part of the package |

Not verified: OMP.

## Vendor corrections (unreleased, validated 2026-10-12)

Six reviewed patches in `patches/` correct 16 vendored files (TAO split leakage and preprocessing parity, Vercel flatMap and localStorage examples, gamedev `asset_report.py --max-colors`, DMAIC statistics, 8D verification sample size, Is/Is-Not, 5-Why and Fishbone reasoning); see [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md#corrected-upstream-files). Node.js 24.21.0, Python 3.14.4 with NumPy 2.5.2 and Pillow 12.1.1 from an existing environment (nothing installed).

| Check | Result and scope |
|---|---|
| `node scripts/check.mjs` | Passes: 353 files, 16 corrected, 6 patches. Each patch reversed on the distributed file reproduces the recorded upstream SHA-256, size and Git blob, and applied again reproduces the distributed file |
| `tests/vendor-corrections.test.mjs` | 30 tests. Runs the corrected TAO and gamedev CLIs on generated images (numeric names, near-duplicates, filename and verified groups; spec-only, equal, BGR, shape, invalid input; limit, limit+1, more colours, alpha and size), executes the Vercel code blocks extracted from the rules and the compiled `AGENTS.md` (falsy values, storage write/read/parse/remove failures), recomputes the DMAIC Welch test, CI, effect size, Ppk and normal tails and the 8D sample sizes and zero-failure bound from the documents' inputs, and runs the upstream originals (reversed patches) as negative controls. Tampered files, manifests and patches fail verification |
| `python3 scripts/vendor_sources.py` + `build_catalog.py` in a scratch copy | Fresh fetch from GitHub at the locked commits, run twice: `vendor/`, file modes, `vendor-integrity.json`, `THIRD_PARTY_NOTICES.md`, `catalog.json` and routing skills identical to the repository |
| `npm pack` round trip | The archive contains `patches/`; `check.mjs` and the correction tests pass in the extracted package |
| `tests/pi-loader.mjs` with Pi 1.1.0 | Seven routing skills, zero diagnostics, zero extension errors |

Not verified: model behaviour with the corrected guidance, and manufacturing or vision outcomes; the statistics tests check arithmetic and stated reasoning, not real process data.

## Selection policy pilot (2026-10-12, not shipped in the package)

`experiments/policy-pilot/` in the repository holds a real-model pilot of four content-policy proposals (Ponytail/ECC default, Verification as a separate skill, manual-only vs. conditional tool skills, split DMAIC). It ran 90 sessions with Claude Opus 5.5 and Haiku 5.5 in scratch copies, then re-ran the 40 runs of the pair groups that had used the shared host /tmp inside a bubblewrap boundary (read-only host, private /tmp). All 130 runs met their acceptance checks, and the vendor texts were rarely or never opened (Verification never), so the pilot supports none of the four proposals; all four stay on hold. Operational defaults were not changed.

`experiments/policy-pilot-2/` is a follow-up with harder tasks, skill texts delivered by explicit selection or profile, ast-grep installed and every run inside a stricter boundary (whole HOME hidden): 174 confirmatory runs (Opus 87/87 and Haiku 86/87 accepted, list price $24.91 including calibration). Attached Ponytail+ECC text gave smaller diffs in all 12 pairs, router wording changed ast-grep use without changing accuracy, and Verification-vs-principle and the DMAIC split showed no attributable quality difference; all four proposals stay on hold and operational defaults are unchanged. See its README for the configurations, raw records, limits and reproduction commands.

## Limits of this validation

- OMP is tested against the common extension contract and its array-shaped `systemPrompt`; the OMP binary itself was not installed or run.
- No end-to-end model conversation was executed against a paid model API. Skill discovery and extension behavior are verified; model compliance and output quality still depend on the selected model, tools, context and task.
- No image, audio or video provider API was called, no account was authenticated, and no media or 3D generation quality was claimed.
- No GPU training, dataset evaluation, actual game-engine playback or manufacturing process change was performed.
- `doctor` is a presence report, not provider readiness certification. `install-deps` is tested with fake runners only (npm prefix, `npm install -g @ast-grep/cli`, `pipx install uv`); no real install is performed by the tests.

Reproduction commands are documented in the README. Tests and checks are included in the package.
