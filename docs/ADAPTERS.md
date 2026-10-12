# Pi integration notes

These are newly authored integration instructions. Files under `vendor/` are the locked upstream files; a few carry reviewed corrections, each marked `Modified by pi-workbench` and recorded as a patch in `patches/` (see [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md#corrected-upstream-files)). Source commits, licenses, checksums and the upstream digests of corrected files are recorded separately.

## How selection works

The extension registers `/workbench`. Pi discovers only the seven routing skills under `skills/`; the original skill collection is kept under `vendor/` and is read when needed. This avoids placing every original skill's instructions in every request.

- `auto` is the default. Normal Pi skill discovery chooses a suitable `wb-*` routing skill from its name and description. Automatic selection is model behavior, not a forced keyword classifier.
- `/workbench use <profile>` stores a profile on the current session branch. Each model request then carries exactly one copy of that profile's concise directions, file locations and integration notes, placed first in the request's conversation. It is built per request from the current branch (Pi `context` event) and never stored in the session, so it does not accumulate across requests, follows branch switches and reloads, and disappears with `auto` or `off`. Profile guidance or command output that an earlier version stored is left out of requests; the session file and any summary already produced are not rewritten. Hosts without Pi's structured prompt options (for example OMP) fall back to an additive message per request.
- `/workbench skill <id>` attaches the complete bundled `SKILL.md` (the locked upstream file, or its reviewed correction marked `Modified by pi-workbench`; see [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md#corrected-upstream-files)) plus its location and notes to the next user request: a prompt, a steering or follow-up message typed while the agent works, an RPC prompt, or a user message an extension submits on the user's behalf (for example `/orche single`, a held-back follow-up, a session-bus queue replay). It goes in front of that request in Pi's `/skill:` block format and states that it applies to the user request that follows it in the same message and the work that request starts, not to later requests, even though the text stays in the conversation history. Messages that extensions send themselves (task results, notes from other sessions, also with `triggerTurn`) are not user requests and do not take it. Selecting the same skill again adds it once; several skills go in one block in selection order. `/workbench status` lists pending selections, `/workbench cancel [id]` removes one or all, and `/reload`, a branch change (`/tree`) and a session switch, new session or fork drop them with a notice (a cancelled branch change keeps them). A request Pi expands itself (`/skill:` command, prompt template) keeps its command first: an idle one gets the selection as a message right after it, worded for the request immediately before it. One queued while the agent works cannot carry it, because Pi expands and queues it right after the input event and calls no extension hook again before the model receives it; the selection is then cancelled with a notice instead of moving on to a later request. Selecting does not start a model turn or change the profile.
- `/workbench use off` stops added profile guidance. It does not uninstall the native routing skills or erase prior messages. Remove or disable the package in Pi to stop exposing its routing skills entirely.
- `list`, `status`, `doctor` and help output is a session entry (`pi-workbench.command-output`) that Pi keeps out of model requests and compaction. The interactive transcript renders it, so a later notification does not replace it, and it is shown again when the session is reopened. Pi writes a session file only once the session has a user or assistant message, so the records of a session with commands only are not on disk until then. Checked with the Pi 1.1.0 CLI: RPC clients receive a `notify` UI request and an `entry_appended` event, JSON mode emits only the `entry_appended` event (`entry.data.text`), and text print mode (`pi -p`) prints neither. Short confirmations (`use`, `skill`, `cancel`) are notifications only.
- Profile changes are restored from the current branch, so settings from a different conversation branch are not applied to this branch.

Use the user's language and current scope. User instructions and host constraints take precedence over general process examples in upstream skills. Existing approval or authorization remains valid. Skill selection alone does not authorize deployments, messages to other people, purchases or unrelated project changes.

## Paths and host tools

Use the original `SKILL.md` location as the base directory for its references, assets and scripts. A command such as `python scripts/example.py` in an upstream guide means that skill's script, not an arbitrary script in the current project. Prefer an absolute script path and keep the output in the user's chosen project or artifact directory.

Do not assume `${CLAUDE_PLUGIN_ROOT}`, `~/.claude/skills`, `.codex` paths, Claude hooks, `Agent(...)`, Codex `image_gen`, browser tools or a particular MCP server exist in Pi. Use only capabilities actually exposed by the current host. Follow an available official documentation or CLI path when appropriate; otherwise describe the concrete missing capability and complete any independent work.

Reading or installing this extension does not run upstream scripts, install provider software, start servers, connect accounts or call a paid generation API. There are no install hooks or bundled API credentials. Later task execution follows the user's request and host controls.

## Requirements and analysis

Requirements elicitation targets user outcomes, functional behavior, quality requirements, constraints and acceptance criteria. Keep unknown NFR targets as TBD with a proposed measurement method. Do not choose architecture or impose workshop counts merely because an upstream example does so.

For cause analysis use a fact/evidence ledger, competing hypotheses and the smallest discriminating check. For alternatives first apply hard constraints, then compare effectiveness, evidence, cost, maintenance, reversibility and uncertainty. Cite sources for external facts. Weighted scores are decision assumptions, not measured probabilities. See the analysis and comparison sections of `WORKFLOWS.ko.md`.

NVIDIA recipe-transfer checks, 8D and DMAIC supply domain methods. Their numerical examples, thresholds, time windows and process gates are context-dependent. Do not invent physical containment, customer approval, measured process capability, reproduction results or GPU experiments.

## Ponytail, ECC and coding scope

Use **Ponytail full** by default for implementation. Reuse existing patterns and dependencies, preserve complete behavior, and make verification proportional to the actual risk. A short patch is not successful if it drops validation, accessibility, security, calibration logic or user requirements.

In this package a one-request selection is scoped to that request; Ponytail's original session-persistence wording does not turn it into an independent global mode. A selected coding profile can keep Ponytail available across turns. Respect an explicit profile change. For Ponytail Review use the user's language and perform code changes only if the user requested them.

Use ECC Search First as a lightweight preflight for small tasks and a deeper comparison for substantial new functionality. Use the current host's tools and skill locations. This package does not install the full ECC or Superpowers agent/hook orchestration and does not require TDD for every edit.

React guidance applies to React/Next.js projects. ast-grep provides syntax-pattern analysis; it does not become a type checker or call-graph engine. Check whether the installed version supports `outline`. Property-based testing is useful where real invariants expose risk, such as coordinate transforms, parsing and round trips; preserve the existing project test conventions.

## UI UX Pro Max

This skill includes its Python scripts and local design CSVs. Its original `${CLAUDE_PLUGIN_ROOT}/.claude/...` examples must be resolved against the bundled skill directory instead.

From the extension root, inspect its supported options without changing a project:

```bash
python3 vendor/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/scripts/search.py --help
```

The data is a local design reference, not current web research. Fetch actual game or product references when the user's decision benefits from them. Preserve an existing design system rather than replacing it merely to follow a suggested style.

## Image, sound and music generation

The OpenAI image skill contains the original CLI and reference material, but Pi has no built-in Codex image tool solely because this package is installed. Prefer a generation tool already configured by the user. For the API route, the user must select that provider path and supply credentials through their environment or normal credential store. Use the bundled CLI help for supported flags rather than guessing a model name.

ElevenLabs skills require a usable CLI/SDK or connected tool and an account that supports the requested feature. API key presence does not prove authentication, subscription, remaining quota or output rights. Do not print key values or put them in a prompt, repository, log or generated file. Do not run an upstream shell installer automatically.

When generation is available, make a representative asset first, inspect it at the actual display size, and only then create coherent variants. Inspect sprites in motion, check alpha edges and import settings, and listen to audio in the game mix. Without playback or viewing capabilities, explicitly identify the unperformed QA.

If a provider is unavailable, complete the art direction, asset manifest, generation prompts and acceptance criteria. Report those as a completed brief and actual asset generation as pending; do not substitute a textual description for a claimed image, sound or movie.

## Video Director and VFX

Video Director edits and renders supplied footage with HyperFrames and local media tools. Node 22+, FFmpeg/ffprobe, Python packages and the appropriate HyperFrames workflow must be available when those paths are used. HyperFrames and its related skills are not included in this collection. Inspect the bundled guide to choose the required setup; do not silently run its update/install commands. A model-based text-to-video provider is a separate integration.

Repository-root Video Director example media is excluded from this package. Use footage and audio whose provenance and rights are known. Verify render dimensions, frame rate, safe areas, actual playback, title readability and audio mix. A still contact sheet cannot verify playback or sound.

The bundled fire/smoke implementation targets Three.js r170, WebGL2 and GLSL. Use its ready-made module only in compatible projects. Other engines can use its reference quality criteria while implementing the effect using their own APIs and shaders.

## Dependency report

`/workbench doctor` checks names on PATH and whether selected environment variables are nonempty. It does not execute those programs, authenticate providers, inspect secret values, test installed versions, discover all MCP tools or validate Python package dependencies. Its output is a setup aid; successful generation and runtime QA still require an actual task-specific check.

Source updates are deliberate. `sources.lock.json` pins commits; `scripts/vendor_sources.py` fetches selected files and verifies Git blob content without executing it. Review updated instructions, licenses, references and dependencies before changing a lock. Rebuild routing files with `python3 scripts/build_catalog.py`, then run the package checks.
