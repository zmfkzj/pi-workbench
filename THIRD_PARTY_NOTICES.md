# Third-party notices

This package is a collection. Upstream files under `vendor/` are distributed with their own licenses; they are not relicensed under the extension's MIT license. They are byte-for-byte copies of the locked upstream commits, except the files listed under [Corrected upstream files](#corrected-upstream-files), which carry reviewed corrections. Routing files and adapters are separate, newly authored integration instructions. No upstream example media outside the selected directories is included.

Exact commits are recorded in `sources.lock.json`, and every bundled file has a Git blob SHA and SHA-256 digest of its distributed bytes in `vendor-integrity.json`; corrected files also record the upstream digests.

| Source | Commit | License | Preserved notice files |
|---|---|---|---|
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/9b58c1ffb790c075ca32e70a89cf1d80588f4abf) | `9b58c1ffb790c075ca32e70a89cf1d80588f4abf` | MIT | [upstream LICENSE](vendor/ponytail/LICENSE) |
| [affaan-m/ECC](https://github.com/affaan-m/ECC/tree/8ce348fbea0d66f5c49c7b35e8ba8bb143b15132) | `8ce348fbea0d66f5c49c7b35e8ba8bb143b15132` | MIT | [upstream LICENSE](vendor/ecc/LICENSE) |
| [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44) | `dbd4588f9e1033efb41dad4bef2f7947c8993d44` | Apache-2.0 | [upstream skills/frontend-design/LICENSE.txt](vendor/anthropic-skills/skills/frontend-design/LICENSE.txt) |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/67803eac81607188194aea9842a723b89326d90d) | `67803eac81607188194aea9842a723b89326d90d` | MIT | [upstream LICENSE](vendor/ui-ux-pro-max/LICENSE) |
| [qa-aman/claude-skills](https://github.com/qa-aman/claude-skills/tree/72ef27fe4fe791363be7c811a16c25ffaa6ea9c0) | `72ef27fe4fe791363be7c811a16c25ffaa6ea9c0` | MIT | [upstream LICENSE](vendor/requirements/LICENSE) |
| [schattenspiegel/skill-foundry-skills](https://github.com/schattenspiegel/skill-foundry-skills/tree/d09a0109b081d9e350c2e48e8e8d8282da5976b8) | `d09a0109b081d9e350c2e48e8e8d8282da5976b8` | MIT | [upstream LICENSE](vendor/problem-solving/LICENSE) |
| [meiiie/structured-root-cause-research-skill](https://github.com/meiiie/structured-root-cause-research-skill/tree/bf2b7ef2277d72ac5cca59929f15c10b0c808bfd) | `bf2b7ef2277d72ac5cca59929f15c10b0c808bfd` | MIT | [upstream LICENSE](vendor/root-cause/LICENSE) |
| [saschb2b/skills](https://github.com/saschb2b/skills/tree/007d499932facd683aae4775dc0d341dca91e53b) | `007d499932facd683aae4775dc0d341dca91e53b` | MIT | [upstream LICENSE](vendor/game-design/LICENSE) |
| [NVIDIA-TAO/tao-skill-bank](https://github.com/NVIDIA-TAO/tao-skill-bank/tree/6e022786ab6afe8aa41c877e0d6c9fd391a38fda) | `6e022786ab6afe8aa41c877e0d6c9fd391a38fda` | Apache-2.0 | [upstream LICENSE](vendor/tao/LICENSE) |
| [voxel51/fiftyone-skills](https://github.com/voxel51/fiftyone-skills/tree/8b87befcce6cfb86e73b4ccc1f692a0a2b6a4218) | `8b87befcce6cfb86e73b4ccc1f692a0a2b6a4218` | Apache-2.0 | [upstream LICENSE](vendor/fiftyone/LICENSE) |
| [RBraga01/Quality-Engineering-Skills](https://github.com/RBraga01/Quality-Engineering-Skills/tree/70df27cbd6a5ad6808499e934d2c72be4f8bef1e) | `70df27cbd6a5ad6808499e934d2c72be4f8bef1e` | MIT | [upstream LICENSE](vendor/quality-engineering/LICENSE) |
| [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd) | `0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd` | Apache-2.0 | [upstream LICENSE](vendor/gamedev/LICENSE), [upstream NOTICE](vendor/gamedev/NOTICE) |
| [openai/codex](https://github.com/openai/codex/tree/a07c8ebd57feedc4cf5dfe854c8e9101de54186b) | `a07c8ebd57feedc4cf5dfe854c8e9101de54186b` | Apache-2.0 | [upstream codex-rs/skills/src/assets/samples/imagegen/LICENSE.txt](vendor/codex-imagegen/codex-rs/skills/src/assets/samples/imagegen/LICENSE.txt) |
| [elevenlabs/skills](https://github.com/elevenlabs/skills/tree/1d08a4a250cff67cc8056ec31587c031ecb06d2f) | `1d08a4a250cff67cc8056ec31587c031ecb06d2f` | MIT | [upstream LICENSE](vendor/elevenlabs/LICENSE) |
| [DotanVG/video-director-skill](https://github.com/DotanVG/video-director-skill/tree/59d5909fca60166c430aa43811c6fb389d490e3b) | `59d5909fca60166c430aa43811c6fb389d490e3b` | MIT | [upstream LICENSE](vendor/video-director/LICENSE) |
| [MengTo/Skills](https://github.com/MengTo/Skills/tree/83a47fee32f0b6349bff1fede99257a5ef03dc93) | `83a47fee32f0b6349bff1fede99257a5ef03dc93` | MIT | [upstream LICENSE](vendor/vfx/LICENSE) |
| [upstash/context7](https://github.com/upstash/context7/tree/522c4db4fa2e1e31f1b320f09fa8c8fab376987a) | `522c4db4fa2e1e31f1b320f09fa8c8fab376987a` | MIT | [upstream LICENSE](vendor/context7/LICENSE) |
| [ast-grep/agent-skill](https://github.com/ast-grep/agent-skill/tree/f2175aff21f20cfb8e2db30c28febeb3a2d42b61) | `f2175aff21f20cfb8e2db30c28febeb3a2d42b61` | MIT | [upstream README.md](vendor/ast-grep/README.md), [upstream ast-grep/.claude-plugin/plugin.json](vendor/ast-grep/ast-grep/.claude-plugin/plugin.json) |
| [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a77741419a4ab5f06e711a283343f1ada0c3) | `bb92a77741419a4ab5f06e711a283343f1ada0c3` | MIT | [upstream LICENSE](vendor/superpowers/LICENSE) |
| [trailofbits/skills](https://github.com/trailofbits/skills/tree/442fc9d6c89b1e937e6f7a477e7071ea75fcbea4) | `442fc9d6c89b1e937e6f7a477e7071ea75fcbea4` | CC-BY-SA-4.0 | [upstream LICENSE](vendor/property-testing/LICENSE) |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278) | `063bee94c3f4df8453406c830b0a7df0f2860278` | MIT | [upstream README.md](vendor/vercel/README.md) |

- **ast-grep**: MIT declared in README and plugin manifest; upstream has no standalone LICENSE file.
- **vercel**: MIT declared in README and skill frontmatter; upstream has no standalone LICENSE file.

Three byte-identical Vercel compatibility aliases repair relative links in the upstream compiled guide. Their original source paths are recorded as `aliasOf` in the integrity manifest; the aliased files are not modified.

## Corrected upstream files

Reviewed corrections fix verified errors in the files below. Each changed file carries a `Modified by pi-workbench` notice, and its upstream copyright, SPDX and license lines are preserved; the unified diff in `patches/` (paths relative to the upstream repository) records the exact change. `scripts/vendor_sources.py` verifies the upstream Git blob before applying the patches strictly, and `scripts/check.mjs` reverses each patch and verifies the recorded upstream bytes. The corrections are distributed under the license of the file they change. The upstream links in the table above point to the uncorrected originals.

| Source | Patch | Changed files | Correction |
|---|---|---|---|
| tao (Apache-2.0) | [0001-leakage-evidence-and-parity-modes.patch](patches/tao/0001-leakage-evidence-and-parity-modes.patch) | `skills/applications/tao-validate-recipe-transfer/SKILL.md`<br>`skills/applications/tao-validate-recipe-transfer/references/recipe_spec.yaml`<br>`skills/applications/tao-validate-recipe-transfer/scripts/preprocess_parity.py`<br>`skills/applications/tao-validate-recipe-transfer/scripts/split_leakage_check.py` | split_leakage_check.py no longer merges purely numeric file names into one empty filename group and reports filename-stem overlap as a suspicion separate from near-duplicate images and verified --groups; preprocess_parity.py no longer prints that paths agree after a spec-only run and rejects duplicate --path names; SKILL.md and recipe_spec.yaml use the real CLI options. |
| quality-engineering (MIT) | [0001-dmaic-statistics.patch](patches/quality-engineering/0001-dmaic-statistics.patch) | `skills/problem-solving/dmaic/SKILL.md`<br>`skills/problem-solving/dmaic/references/statistical-tools.md` | DMAIC worked example recalculated (Welch p about 0.023, 95% CI, normal-model tail estimate 15.9% to 9.8%) with a corrected conclusion; decision rules no longer treat significance as proof of cause or non-significance as proof of no effect. |
| quality-engineering (MIT) | [0002-8d-verification-sample.patch](patches/quality-engineering/0002-8d-verification-sample.patch) | `skills/problem-solving/8d-problem-solving/SKILL.md`<br>`skills/problem-solving/8d-problem-solving/references/d0-d8-guide.md` | 8D D6 sample size follows n >= log(alpha)/log(1-p) (2% at alpha 0.05 rounds up to 149; a higher rate needs fewer units), and zero recurrence in the sample is a bound on the remaining rate, not proof of permanent elimination. |
| quality-engineering (MIT) | [0003-root-cause-reasoning.patch](patches/quality-engineering/0003-root-cause-reasoning.patch) | `skills/problem-solving/5why-root-cause/SKILL.md`<br>`skills/problem-solving/fishbone-analysis/SKILL.md`<br>`skills/problem-solving/is-is-not-scoping/SKILL.md`<br>`skills/problem-solving/is-is-not-scoping/references/hypothesis-elimination.md` | Is/Is-Not no longer eliminates an inspection-gauge hypothesis with the escape it would explain; the 5-Why reversibility test reads cause to effect and drops the never-recur promise; a single-shift fishbone pattern is a hypothesis, not an operator cause. |
| gamedev (Apache-2.0) | [0001-asset-report-max-colors-boundary.patch](patches/gamedev/0001-asset-report-max-colors-boundary.patch) | `skills/disciplines/create-game-assets/scripts/asset_report.py` | asset_report.py --max-colors also fails an image with exactly limit+1 colors. |
| vercel (MIT) | [0001-flatmap-falsy-and-storage-migration.patch](patches/vercel/0001-flatmap-falsy-and-storage-migration.patch) | `skills/react-best-practices/AGENTS.md`<br>`skills/react-best-practices/rules/client-localstorage-schema.md`<br>`skills/react-best-practices/rules/js-flatmap-filter.md` | The flatMap examples keep the falsy-value filtering of .filter(Boolean), and the localStorage migration removes the v1 key only after the v2 value was stored; the compiled AGENTS.md carries the same corrections as the rules. |

## License boundaries

- Trail of Bits property-based-testing and its bundled original references remain **CC-BY-SA-4.0**. Preserve its source attribution and license. Any distributed adaptation of those materials must satisfy that license's requirements.
- Apache-2.0 license texts and any upstream NOTICE files selected in `sources.json` are preserved alongside the original sources.
- Vercel and ast-grep declare MIT in the preserved upstream documents but do not ship a standalone license file in the selected source repositories. The package does not invent missing copyright notices or pretend such a file exists.
- `video-director` repository-root example media is excluded by the upstream author and is not bundled. The VFX subtree's own provenance notes are retained.
- Model services, fonts, generated outputs, and assets supplied by a user have their own rights and usage terms. A skill's source license does not license unrelated game footage or third-party brands.

## Referenced candidates not redistributed

These remain optional research references; they are not installed by this package. No executable installer fetches them automatically.

| Candidate | Upstream | Reason not bundled |
|---|---|---|
| Jord game-development / asset-generation / blender-workflow | https://github.com/Jord-JD/jord-skills | Redistribution license not established from the inspected upstream files. Reference research and asset QA are covered by authored routing guidance and bundled alternatives. |
| Decision Matrix | https://github.com/lyndonkl/claude | No complete redistribution license found in the inspected source. Problem Solving plus the comparison workflow covers alternatives. |
| Game Balance Analysis | https://github.com/Yuki001/game-dev-skills | Redistribution license not established. Game Design and the authored balance validation guidance cover the workflow. |
| Remotion skills | https://github.com/remotion-dev/skills | Redistribution conditions require further confirmation. Video Director is bundled as a local editing/rendering workflow. |
| Doubleslash requirements elicitation | https://github.com/DoubleslashSE/claude-marketplace | README declares MIT but no standalone license file was found; the bundled qa-aman alternative includes complete MIT terms. |
