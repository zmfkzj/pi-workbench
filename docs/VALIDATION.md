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

## Research Agent Skills (unreleased, validated 2026-10-30)

Added [KalarisLabs/research-agent-skills](https://github.com/KalarisLabs/research-agent-skills) at `b0ee35abfd7e26428846fbd84f282114560a5fbd` as source `research-agent-skills` and the `research` profile (`wb-research`). Node.js 24.21.0, Python 3 without NumPy/Pillow (the Python CLI tests of `vendor-corrections.test.mjs` were skipped with `PI_WORKBENCH_SKIP_PYTHON_TESTS=1`), `@earendil-works/pi-coding-agent` 1.4.0.

| Check | Result and scope |
|---|---|
| `python3 scripts/vendor_sources.py` (cache in a scratch directory) + `build_catalog.py` | 2,419 files of the new source fetched and Git-blob verified (all 281 skill directories, 5 license/provenance files); one `.gitignore` excluded, one patch applied to 8 SKILL.md files. The other 21 sources were fetched again and are byte-identical to the repository |
| `node scripts/check.mjs` | Passes: 8 profiles, 49 selectable skills, 2,772 files, 24 corrected, 7 patches, 1,254 local Markdown links (now also `README.md` and `THIRD_PARTY_NOTICES.md`). Link targets follow CommonMark destinations (`scripts/markdown_links.mjs`), so prose such as `[2, 4](like in a/b.json)` in the DeepSpeed reference is no longer read as a broken link; the only change in the previously checked files |
| `tests/research-skills.test.mjs` | 8 tests: 281 directories tracked with matching frontmatter names; the upstream index lists each of the 280 specialists once; the research profile's 22 entries, routing links, guidance (index path, specialist path, < 12 KB, 22 entries); one-shot base directory and named files; every `references/`, `scripts/`, `assets/`, `templates/` path a research SKILL.md names exists (three documented cross-skill or upstream-project paths aside); licenses, notices, lock and exclusion; CommonMark link targets; `npm pack --dry-run` contains every integrity entry |
| `npm test` | 66 tests pass |
| `tests/pi-loader.mjs`, `tests/pi-session.mjs`, `tests/pi-editor.mjs` with Pi 1.4.0 | Pass. Eight routing skills, no vendor skill discovered natively, `use res`/`list res`/`skill hypothesis-g` completion; a real session with `/workbench use research` and `/workbench skill hypothesis-generation` gives the request one research guidance with the index and specialist paths and the skill with its base directory, whose named references exist |

Not verified: research skill scripts, network lookups, paid APIs, LaTeX builds or GPU workflows (none was run), model behaviour with the research profile, OMP, and the umbrella package's own tests (outside this repository).

## Modern Web Guidance and Archify (unreleased, validated 2026-11-15)

Added [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) at `4dd968349e54ca45a05dd5c818fb035c9054b022` ("Release v1.0.0") as source `modern-web-guidance` (skills `modern-web-guidance` and `chrome-extensions`, profile `coding`) and [tt-a1i/archify](https://github.com/tt-a1i/archify) at `e37848822238e3a61b12739185cdadd49843a620` as source `archify` (skill `archify`, profiles `coding` and `analysis`). Node.js 24.21.0, Python 3 with NumPy and Pillow, `@earendil-works/pi-coding-agent` 1.5.2.

| Check | Result and scope |
|---|---|
| `python3 scripts/vendor_sources.py` (cache in a scratch directory, blob cache seeded from the repository and the upstream clones; every blob verified against the GitHub tree) + `build_catalog.py` | 236 files of modern-web-guidance and 191 of archify (15 prebuilt `examples/*.html` excluded) fetched and Git-blob verified; the 2,772 existing entries are unchanged. Running `build_catalog.py` again changes nothing |
| `npm run check` | Passes: 8 profiles, 52 selectable skills, 3,199 files, 1,322 local Markdown links |
| `npm test` | 83 tests pass, 8 of them in the new `tests/web-diagram-skills.test.mjs`: catalog entries point at the original SKILL.md at the locked commit and appear in the `wb-coding`/`wb-analysis` routes; coding guidance < 12 KB with the new paths and notes; one-shot selection carries base directory, notes and dependencies; every path the Chrome Extensions and Archify texts name exists; the upstream README's 204 guide links resolve to bundled `guides/<category>/<id>.md` (209 guide files, all tracked); the 18 gated guide IDs in `docs/ADAPTERS.md` are bundled guides; only the 15 renderings are excluded and no bundled file reads them; licenses, NOTICE and notices; the bundled Archify CLI's `doctor` passes and `demo` reproduces the excluded web-app rendering's Git blob |
| `tests/pi-loader.mjs`, `tests/pi-session.mjs`, `tests/pi-editor.mjs` with Pi 1.5.2 | Pass: eight routing skills, zero diagnostics and extension errors |
| `modern-web-guidance` npm 1.0.0 (packed into a scratch directory, CLI run there with `DISABLE_TELEMETRY=1`) | Its `guides/` and `SKILL.md` equal the bundled files; `search "light dismiss dialog"` returned matching IDs; `retrieve dialog` output contains the bundled `ui-components/dialog.md`; `retrieve webmcp` returned the Origin Trial gate; the gated IDs come from its `gen/guides.json` |
| Archify `finalize sequence` on the bundled `cache-miss-request.sequence.json` in a scratch directory | validate, deliver, check and browser-check pass with Playwright's Chromium and `ARCHIFY_CHROME_NO_SANDBOX=1`. Without that variable this host's Chromium aborts ("No usable sandbox", AppArmor user-namespace restriction), and the snap Chromium could not create its profile under `/var/tmp`; both runs reported `browser-check:fail` with exit 1 |

Not verified: `npx modern-web-guidance@latest` itself (the registry's 1.0.0 package was run locally instead), `legacy-scan`, model behaviour with the new skills, an Archify explainer, visual review of a generated diagram, a Chrome extension load, and OMP.

## Routing descriptions and Quality-Engineering child skills (unreleased, validated 2026-11-15)

Each profile in `catalog.json` gained a `routing` text (the requests and outputs it covers, Korean with a short English cue list) that `scripts/build_catalog.py` appends to the generated `wb-*` description, rejecting descriptions over Pi's 1,024 characters. The descriptions are now 258–471 characters, 2,825 together (1,066 before). The already bundled Quality-Engineering skills `is-is-not-scoping`, `5why-root-cause`, `fishbone-analysis` (profiles `manufacturing` and `analysis`) and `8d-report-writing` (`manufacturing`) became catalog entries with Pi integration notes; no vendor file, patch or license changed. Pi still discovers only the eight routing skills; no direct wrapper or runtime classifier was added. Node.js 24.21.0, `@earendil-works/pi-coding-agent` 1.5.2.

| Check | Result and scope |
|---|---|
| `build_catalog.py` | Run twice: `catalog.json`, the eight routing skills and `THIRD_PARTY_NOTICES.md` are identical after the second run |
| `npm run check` | Passes: 8 profiles, 56 selectable skills, 3,199 files, 1,329 local Markdown links |
| `npm test` | 89 tests pass, 6 of them in the new `tests/routing-skills.test.mjs`: generated descriptions equal the catalog formula and stay within 1,024 characters (all eight under 3,000); `skills/` holds only the eight routing directories and `pi.skills` is unchanged; the four entries point at their integrity-tracked upstream `SKILL.md` at the locked commit with MIT provenance, two-way profile membership, route-table links and notes; their notes keep the evidence, candidate and customer-action limits; profile guidance, one-shot selection (raw text, base directory, notes) and `/workbench skill` completion reach them; the 17 representative requests in `tests/routing-requests.json` map onto routing wording and catalog membership. These are metadata checks, not model selection |
| `tests/pi-loader.mjs`, `tests/pi-session.mjs`, `tests/pi-editor.mjs` with Pi 1.5.2 | Pass: eight routing skills, zero diagnostics and extension errors, `skill 5w`/`skill 8d-r` completion |
| `experiments/routing-selection/` (408 real Pi print sessions, bubblewrap, read-only tools) | Sonnet 5.5 (thinking medium), 12 tuning requests: an acceptable routing skill was opened in 25/36 runs before, 33/36 after; an acceptable bundled skill in 6/36 before, 23/36 after. 5 held-out requests: routing 2/15 → 9/15, bundled skill 0/15 → 2/15. Haiku 5.5 (thinking low) mostly answered without skills (routing 27/85 → 37/85, bundled skill 3/85 → 3/85). Small samples; opening a file is not answer quality. See its README for per-request results, misses and limits |

Not verified: answer quality with the new routing, other models and OMP, conversations with prior context or project files, and whether a direct wrapper would fix the recurring misses (`sample-size`, `sequence-diagram`).

## Research index path, Archify dependencies and routing follow-ups (unreleased, validated 2026-11-15)

The research profile names its index as a catalog `indexes` entry: `wb-research` links it relative to the routing skill (`../../vendor/research-agent-skills/skills/research-agent-skills/references/catalog.md`) with its package path, `/workbench use research` gives the absolute path, and `scripts/check.mjs` verifies the link. `/workbench doctor` gained `Chrome/Chromium for Archify`, found exactly as Archify's `findChrome` finds it (a set `ARCHIFY_CHROME` is used alone, then install locations, PATH, Edge); a snap browser with a temporary directory outside the home directory is a warning, because the snap cannot open Archify's temporary profile and page. `/workbench install-deps` creates `~/snap/<snap>/common/archify-tmp` for that case and downloads no browser. The Archify catalog note tells the agent to keep an existing `ARCHIFY_CHROME` and to retry once with that `TMPDIR` only after a snap failure.

| Check | Result and scope |
|---|---|
| `npm test` | 93 tests pass, including the `findChrome` parity matrix (Linux, macOS, Windows, Edge fallback, empty or wrong `ARCHIFY_CHROME`, case-insensitive Windows variables), snap and `TMPDIR` cases, the idempotent install-deps directory step, and the research index link |
| `npm run test:measurement` | 7 tests of the measurement event accounting (successful calls only, index read and grep, wrong paths, cache-separated tokens, missing cost, finalize, negative requests, runnable scenarios) |
| `npm run check`, `build_catalog.py` twice | Pass, 1,331 local Markdown links; the generated files are unchanged by a second build |
| `tests/pi-loader.mjs`, `tests/pi-session.mjs`, `tests/pi-editor.mjs` with Pi 1.5.2 | Pass, zero skill diagnostics and extension errors |
| `pi --mode json -p "/workbench doctor"` and `"/workbench install-deps"` on this host (Pi 1.5.2, no model call) | doctor: warning, the chromium snap 157.0.8103.38 at `/snap/bin/chromium` with `TMPDIR=/var/tmp/pi-arthur`; install-deps: manual, `~/snap/chromium/common/archify-tmp` already present, nothing else to install (Node v24.21.0, ast-grep and uv present) |
| Archify `doctor`, `demo`, `finalize sequence` (bundled cache-miss example) | `doctor` ready, `demo` written. `finalize` with `TMPDIR=$HOME/snap/chromium/common/archify-tmp`: validate, deliver, check and browser-check pass. Without it, and with `TMPDIR=/tmp`, browser-check fails (profile `SingletonLock` permission denied, or `ERR_FILE_NOT_FOUND` for the page). Chrome for Testing aborts with "No usable sandbox" on this Ubuntu unless `ARCHIFY_CHROME_NO_SANDBOX=1`; it was used only inside the measurement sandbox. No visual review |
| `experiments/routing-selection/` round 2 (250 real Pi sessions, $15.38 of a $25 ceiling) | Index clarification kept; statistical-power wrapper and diagram wording not adopted; details and limits in the experiment README |

Not verified: Archify on macOS or Windows hosts, a non-snap Linux Chrome outside the sandbox, visual quality of generated diagrams, and answer quality beyond a small LLM-scored rubric.

## Research formulation guidance (unreleased, validated 2026-11-21)

The research profile and the integration notes for `scientific-brainstorming` and `hypothesis-generation` now reach [Research formulation](RESEARCH_FORMULATION.ko.md) through the Pi adapters. The authored procedure adds one problem-framing step before hypotheses for new research directions, stalled approaches and explicit reframing. It preserves the original goal, evaluation criteria and fixed methods, reuses applicable earlier formulations, and skips routine summaries, translations, specified calculations and execution of chosen hypotheses. No runtime, vendor source or dependency changed. Node.js 24.22.3, Python 3.12.14 with NumPy 2.3.5 and Pillow 13.0.0; available Pi host 1.1.0.

| Check | Result and scope |
|---|---|
| `npm test` | 93 tests pass, zero failures and zero skips, including the Python CLI checks. The research/routing subset also passes after adding the new guide to the package inclusion assertion (15 tests) |
| `node scripts/check.mjs` | Passes: 8 profiles, 56 selectable skills, 3,199 upstream files, 24 corrected files, 7 patches and 1,336 local Markdown links |
| `python3 scripts/build_catalog.py` | Rebuilding leaves `catalog.json`, all eight routing skills and `THIRD_PARTY_NOTICES.md` byte-identical. Research profile guidance is 10,597 bytes (limit 12,000); the eight routing descriptions total 2,874 characters (limit 3,000) |
| Skill frontmatter validation and `tests/pi-loader.mjs` with Pi 1.1.0 | Pass: eight routing skills, zero skill diagnostics and zero extension errors. This checks host loading, not automatic model selection |
| Independent change review | No actionable correctness or integration findings; checked profile and one-shot reachability, relative adapter links, packaging, scope and paper attribution |
| Two qualitative instruction checks in fresh ChatGPT subagent sessions, without inherited conversation | Supplied the actual `profileGuidance` text for an exploratory vision request and the actual `skillSelectionText` for a translation-only request. The research answer read the guide, kept the frozen DINOv2, per-image maximum of 8 candidates, joint recall ≥90% and precision ≥50% at one fixed operating point, and the development/final-evaluation boundary; it connected five distinct questions to hypotheses and rejection criteria, marking unobserved explanations as assumptions. The translation answer returned only the translation. These are one case per path, reviewed qualitatively, with no baseline, Pi model run or performance estimate |

[The evaluation plan](../experiments/research-formulation/README.md) and 20 synthetic requests are prepared for a future paired A/B comparison against `2fe50ad98b9d7e546be45a6589a07543b95076e2`. They are public development material, not an independent holdout. The A/B comparison has not run. Research-quality, diversity, cost and experimental-performance improvements remain unmeasured; the paper's full-pipeline results are not Workbench results. Automatic routing with this wording, current Pi versions, OMP and real research outcomes were not verified in this change.

## Selection policy pilot (2026-10-12, not shipped in the package)

`experiments/policy-pilot/` in the repository holds a real-model pilot of four content-policy proposals (Ponytail/ECC default, Verification as a separate skill, manual-only vs. conditional tool skills, split DMAIC). It ran 90 sessions with Claude Opus 5.5 and Haiku 5.5 in scratch copies, then re-ran the 40 runs of the pair groups that had used the shared host /tmp inside a bubblewrap boundary (read-only host, private /tmp). All 130 runs met their acceptance checks, and the vendor texts were rarely or never opened (Verification never), so the pilot supports none of the four proposals; all four stay on hold. Operational defaults were not changed.

`experiments/policy-pilot-2/` is a follow-up with harder tasks, skill texts delivered by explicit selection or profile, ast-grep installed and every run inside a stricter boundary (whole HOME hidden): 174 confirmatory runs (Opus 87/87 and Haiku 86/87 accepted, list price $24.91 including calibration). Attached Ponytail+ECC text gave smaller diffs in all 12 pairs, router wording changed ast-grep use without changing accuracy, and Verification-vs-principle and the DMAIC split showed no attributable quality difference; all four proposals stay on hold and operational defaults are unchanged. See its README for the configurations, raw records, limits and reproduction commands.

## Limits of this validation

- OMP is tested against the common extension contract and its array-shaped `systemPrompt`; the OMP binary itself was not installed or run.
- The package tests run no model. Recorded Pi model experiments are in the repository's `experiments/` (the two policy pilots and the routing-selection measurement), with small samples, two Claude models and single-request sessions. The separate qualitative ChatGPT checks above are not Pi model experiments. Skill discovery and extension behavior are verified; model compliance and output quality still depend on the selected model, tools, context and task.
- No image, audio or video provider API was called, no account was authenticated, and no media or 3D generation quality was claimed.
- No GPU training, dataset evaluation, actual game-engine playback or manufacturing process change was performed.
- `doctor` is a presence report, not provider readiness certification. `install-deps` is tested with fake runners only (npm prefix, `npm install -g @ast-grep/cli`, `pipx install uv`); no real install is performed by the tests.

Reproduction commands are documented in the README. Tests and checks are included in the package.
