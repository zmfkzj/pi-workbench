#!/usr/bin/env python3
"""Build the native Pi routing skills and attribution from checked-in metadata."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    catalog = json.loads((ROOT / "catalog.json").read_text())
    sources = {s["id"]: s for s in json.loads((ROOT / "sources.json").read_text())["sources"]}
    locks = json.loads((ROOT / "sources.lock.json").read_text())["sources"]
    by_id = {s["id"]: s for s in catalog["skills"]}
    for skill in catalog["skills"]:
        source = sources[skill["sourceId"]]
        locked = locks[skill["sourceId"]]
        path = (skill["sourcePath"] + "/" if skill["sourcePath"] else "") + "SKILL.md"
        skill["source"] = {"repository": source["repository"], "path": path, "commit": locked["commit"], "license": source["license"], "url": f"https://github.com/{source['repository']}/blob/{locked['commit']}/{path}"}
    (ROOT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    for profile in catalog["profiles"]:
        path = ROOT / "skills" / f"wb-{profile['id']}" / "SKILL.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        content = [
            "---", f"name: wb-{profile['id']}",
            "description: " + json.dumps(f"{profile['title']}. {profile['description']}. Use for the {profile['id']} workflow; select only relevant bundled skills and their references.", ensure_ascii=False),
            "---", "", f"# {profile['title']}", "",
            profile["guidance"], "",
            "## Start here", "",
            "1. Read the applicable sections of [workflow guidance](../../docs/WORKFLOWS.ko.md) and [Pi adapters](../../docs/ADAPTERS.md).",
            "2. Choose only the skills needed for this request from the table below; do not read every skill.",
            "3. Read the original skill from its linked path. Resolve its scripts and references relative to that original file, not this routing skill or the project directory.",
            "4. Apply the integration notes below and the user's scope. Existing authorization and the user's language take precedence over upstream generic process examples.",
            "5. Report what was actually researched, changed, generated and verified. A missing provider does not become an available tool by reading a skill.", "",
            "## Available skills", "", "| Skill | Use |", "|---|---|",
        ]
        for skill_id in profile["skills"]:
            skill = by_id[skill_id]
            content.append(f"| [{skill['name']}](../../{skill['path']}) | {skill['description']} |")
        content.extend(["", "## Integration notes", ""])
        for skill_id in profile["skills"]:
            skill = by_id[skill_id]
            content.append(f"- **{skill_id}**: " + " ".join(skill["notes"]))
            if skill["dependencies"]:
                content.append("  Required when executing: " + "; ".join(skill["dependencies"]) + ".")
        content.extend(["", "Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use " + profile["id"] + "` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.", ""])
        path.write_text("\n".join(content))
    notices = ["# Third-party notices", "", "This package is a collection. Upstream files under `vendor/` are distributed with their own licenses; they are not relicensed under the extension's MIT license. They are byte-for-byte copies of the locked upstream commits, except the files listed under [Corrected upstream files](#corrected-upstream-files), which carry reviewed corrections. Routing files and adapters are separate, newly authored integration instructions. No upstream example media outside the selected directories is included.", "", "Exact commits are recorded in `sources.lock.json`, and every bundled file has a Git blob SHA and SHA-256 digest of its distributed bytes in `vendor-integrity.json`; corrected files also record the upstream digests.", "", "| Source | Commit | License | Preserved notice files |", "|---|---|---|---|"]
    for source in sources.values():
        locked = locks[source["id"]]
        notices.append(f"| [{source['repository']}](https://github.com/{source['repository']}/tree/{locked['commit']}) | `{locked['commit']}` | {source['license']} | " + ", ".join(f"[upstream {path}](vendor/{source['id']}/{path})" for path in source["licenseFiles"]) + " |")
    notices.append("")
    for source in sources.values():
        if source.get("licenseEvidence"):
            notices.append(f"- **{source['id']}**: {source['licenseEvidence']}")
    notices.extend(["", "Three byte-identical Vercel compatibility aliases repair relative links in the upstream compiled guide. Their original source paths are recorded as `aliasOf` in the integrity manifest; the aliased files are not modified."])
    notices += ["", "## Corrected upstream files", "", "Reviewed corrections fix verified errors in the files below. Each changed file carries a `Modified by pi-workbench` notice, and its upstream copyright, SPDX and license lines are preserved; the unified diff in `patches/` (paths relative to the upstream repository) records the exact change. `scripts/vendor_sources.py` verifies the upstream Git blob before applying the patches strictly, and `scripts/check.mjs` reverses each patch and verifies the recorded upstream bytes. The corrections are distributed under the license of the file they change. The upstream links in the table above point to the uncorrected originals.", "", "| Source | Patch | Changed files | Correction |", "|---|---|---|---|"]
    for source in sources.values():
        for entry in source.get("patches", []):
            changed = [line[6:].split("\t")[0] for line in (ROOT / entry["file"]).read_text().splitlines() if line.startswith("+++ b/")]
            notices.append(f"| {source['id']} ({source['license']}) | [{Path(entry['file']).name}]({entry['file']}) | " + "<br>".join(f"`{path}`" for path in changed) + f" | {entry['reason']} |")
    notices += ["", "## License boundaries", "", "- Trail of Bits property-based-testing and its bundled original references remain **CC-BY-SA-4.0**. Preserve its source attribution and license. Any distributed adaptation of those materials must satisfy that license's requirements.", "- Apache-2.0 license texts and any upstream NOTICE files selected in `sources.json` are preserved alongside the original sources.", "- Vercel and ast-grep declare MIT in the preserved upstream documents but do not ship a standalone license file in the selected source repositories. The package does not invent missing copyright notices or pretend such a file exists.", "- `video-director` repository-root example media is excluded by the upstream author and is not bundled. The VFX subtree's own provenance notes are retained.", "- Model services, fonts, generated outputs, and assets supplied by a user have their own rights and usage terms. A skill's source license does not license unrelated game footage or third-party brands.", "", "## Referenced candidates not redistributed", "", "These remain optional research references; they are not installed by this package. No executable installer fetches them automatically.", "", "| Candidate | Upstream | Reason not bundled |", "|---|---|---|", "| Jord game-development / asset-generation / blender-workflow | https://github.com/Jord-JD/jord-skills | Redistribution license not established from the inspected upstream files. Reference research and asset QA are covered by authored routing guidance and bundled alternatives. |", "| Decision Matrix | https://github.com/lyndonkl/claude | No complete redistribution license found in the inspected source. Problem Solving plus the comparison workflow covers alternatives. |", "| Game Balance Analysis | https://github.com/Yuki001/game-dev-skills | Redistribution license not established. Game Design and the authored balance validation guidance cover the workflow. |", "| Remotion skills | https://github.com/remotion-dev/skills | Redistribution conditions require further confirmation. Video Director is bundled as a local editing/rendering workflow. |", "| Doubleslash requirements elicitation | https://github.com/DoubleslashSE/claude-marketplace | README declares MIT but no standalone license file was found; the bundled qa-aman alternative includes complete MIT terms. |", ""]
    (ROOT / "THIRD_PARTY_NOTICES.md").write_text("\n".join(notices))
    print(f"Built {len(catalog['profiles'])} native routing skills for {len(catalog['skills'])} upstream skills.")


if __name__ == "__main__":
    main()
