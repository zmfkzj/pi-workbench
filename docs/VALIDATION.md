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
| `node --test tests/runtime.test.mjs` | 14 tests: one current profile guidance per request built from the branch (legacy stored guidance and command output dropped, other messages and one-shot skills kept, input untouched), auto/off, busy selection refused including a race during loading, UI-only command output, OMP fallback |
| `tests/pi-loader.mjs` with Pi 1.1.0 | One extension with `context` and `before_agent_start` handlers, seven routing skills, zero diagnostics |
| `tests/pi-session.mjs` with Pi 1.1.0 | A real `AgentSession` with this package and a scripted faux model (11 model requests): one profile guidance per request over three requests, a branch switch, a reload and auto/off; no Workbench profile/output message stored; a skill selection during a run is refused and reaches neither the steering message nor the next idle request; an idle selection reaches the next request. The 0.1.0 runtime fails this check (guidance accumulated), and so does the new runtime with the busy check removed |

Not verified: an interactive TUI session, OMP, model behaviour with real providers, and compaction summaries created before this change (they are not rewritten).

## Limits of this validation

- OMP is tested against the common extension contract and its array-shaped `systemPrompt`; the OMP binary itself was not installed or run.
- No end-to-end model conversation was executed against a paid model API. Skill discovery and extension behavior are verified; model compliance and output quality still depend on the selected model, tools, context and task.
- No image, audio or video provider API was called, no account was authenticated, and no media or 3D generation quality was claimed.
- No GPU training, dataset evaluation, actual game-engine playback or manufacturing process change was performed.
- `doctor` is a presence report, not provider readiness certification.

Reproduction commands are documented in the README. Tests and checks are included in the package.
