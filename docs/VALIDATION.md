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

The three compatibility aliases address upstream links in Vercel's compiled `AGENTS.md` that point beside the document instead of into `rules/`. The original files are unchanged; aliases are exact copies whose provenance is recorded with `aliasOf` in `vendor-integrity.json`.

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

## Limits of this validation

- OMP is tested against the common extension contract and its array-shaped `systemPrompt`; the OMP binary itself was not installed or run.
- No end-to-end model conversation was executed against a paid model API. Skill discovery and extension behavior are verified; model compliance and output quality still depend on the selected model, tools, context and task.
- No image, audio or video provider API was called, no account was authenticated, and no media or 3D generation quality was claimed.
- No GPU training, dataset evaluation, actual game-engine playback or manufacturing process change was performed.
- `doctor` is a presence report, not provider readiness certification.

Reproduction commands are documented in the README. Tests and checks are included in the package.
