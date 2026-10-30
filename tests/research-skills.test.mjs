// The bundled Research Agent Skills collection: every upstream skill is shipped and reachable, the research profile is
// registered, licenses and provenance are kept, Markdown references resolve and the npm package carries every file.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { profileGuidance, readCatalog, readSkill, skillSelectionText } from "../lib/runtime.js";
import { localLinkTargets } from "../scripts/markdown_links.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const json = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));
const SOURCE = "research-agent-skills";
const COLLECTION = `vendor/${SOURCE}`;
const SKILLS = `${COLLECTION}/skills`;
const INDEX = `${SKILLS}/research-agent-skills`;

/** The top-level `name` of a SKILL.md frontmatter, not a `name:` line further down in the body. */
const frontmatterName = (text) => {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text.replace(/\r\n/g, "\n"))?.[1] ?? "";
  return /^name: *(\S+?)\s*$/m.exec(frontmatter)?.[1];
};
const skillDirectories = async () => (await readdir(join(root, SKILLS), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
/** Specialist names as the upstream index lists them: one `- \`name\` — description` line each. */
const indexNames = async () => [...(await readFile(join(root, INDEX, "references/catalog.md"), "utf8")).matchAll(/^- `([a-z0-9-]+)` — /gm)]
  .map((match) => match[1]);

test("all 281 upstream skill directories are bundled, tracked and named after their directory", async () => {
  const directories = await skillDirectories();
  assert.equal(directories.length, 281);
  const tracked = new Set((await json("vendor-integrity.json")).files.map((file) => file.path));
  for (const name of directories) {
    const path = `${SKILLS}/${name}/SKILL.md`;
    assert(tracked.has(path), `untracked ${path}`);
    assert.equal(frontmatterName(await readFile(join(root, path), "utf8")), name, path);
  }
});

test("the upstream index lists every bundled specialist exactly once, so none is unreachable", async () => {
  const names = await indexNames();
  assert.equal(new Set(names).size, names.length, "duplicate index entry");
  const specialists = (await skillDirectories()).filter((name) => name !== "research-agent-skills");
  assert.equal(specialists.length, 280);
  assert.deepEqual([...names].sort(), specialists);
  assert.match(await readFile(join(root, INDEX, "references/catalog.md"), "utf8"), /^280 specialist skills/m);
  for (const name of names) assert((await stat(join(root, SKILLS, name, "SKILL.md"))).isFile(), name);
});

test("the research profile registers the index and the workflow skills and tells how to reach the rest", async () => {
  const catalog = await readCatalog(root);
  const profile = catalog.profiles.find((item) => item.id === "research");
  assert(profile, "research profile");
  assert.equal(profile.skills[0], "research-agent-skills");
  assert.equal(profile.skills.length, 22);
  const route = await readFile(join(root, "skills/wb-research/SKILL.md"), "utf8");
  assert(route.startsWith("---\nname: wb-research\n"));
  for (const id of profile.skills) {
    const skill = catalog.skills.find((item) => item.id === id);
    assert.equal(skill.sourceId, SOURCE, id);
    assert.equal(skill.path, `${SKILLS}/${id}/SKILL.md`, id);
    assert.deepEqual(skill.profiles, ["research"], id);
    assert.equal(frontmatterName(await readFile(join(root, skill.path), "utf8")), id);
    assert(route.includes(`](../../${skill.path})`), `routing link for ${id}`);
  }
  assert(route.includes("vendor/research-agent-skills/skills/<name>/SKILL.md"), "the routing skill names the specialist path");
  const guidance = await profileGuidance(root, catalog, "research");
  assert(guidance.includes(JSON.stringify(join(root, INDEX, "SKILL.md"))), "guidance carries the index location");
  assert(guidance.includes("vendor/research-agent-skills/skills/<name>/SKILL.md"));
  // Every request with the profile carries this text; it lists 22 entries, not the 281 bundled skills.
  assert(Buffer.byteLength(guidance) < 12_000, `profile guidance is ${Buffer.byteLength(guidance)} bytes`);
  assert.equal(guidance.split("\n").filter((line) => line.startsWith("- ")).length, 22);
});

test("a one-shot research selection resolves the skill's own relative references", async () => {
  const catalog = await readCatalog(root);
  for (const id of ["research-agent-skills", "hypothesis-generation", "venue-templates"]) {
    const selection = await readSkill(root, catalog.skills.find((item) => item.id === id));
    assert.equal(selection.baseDir, join(root, SKILLS, id));
    // Upstream names its files as links or as plain relative paths (`references/x.md`, `scripts/x.py`); both resolve here.
    const named = [...selection.raw.matchAll(/\b((?:references|scripts|assets)\/[\w./-]+\.(?:md|py|tex|json))\b/g)].map((match) => match[1]);
    assert(named.length + localLinkTargets(selection.raw).length > 0, `${id} names bundled files`);
    for (const target of [...localLinkTargets(selection.raw), ...named]) await stat(join(selection.baseDir, decodeURIComponent(target)));
    const text = skillSelectionText([selection], root);
    assert(text.includes(`Base directory: ${JSON.stringify(selection.baseDir)}`));
    assert(text.includes(selection.raw));
  }
});

test("files a bundled research SKILL.md names by relative path exist beside it", async () => {
  // Paths that do not mean this skill's own directory: another skill's file, or a script of the upstream project being documented.
  const elsewhere = new Set([
    "autoresearch:references/citation-workflow.md", // the ml-paper-writing skill's reference, named as such
    "bulk-rnaseq:scripts/run_enrichment.py", // the pathway-enrichment skill's script, named as such
    "fine-tuning-serving-openpi:scripts/compute_norm_stats.py", // a script in the openpi repository checkout
  ]);
  const missing = [];
  let checked = 0;
  for (const name of await skillDirectories()) {
    const text = (await readFile(join(root, SKILLS, name, "SKILL.md"), "utf8")).replace(/```[\s\S]*?```/g, "").replace(/<!--[\s\S]*?-->/g, "");
    const named = new Set([...text.matchAll(/(?<![\w/.-])((?:references|scripts|assets|templates)\/[\w./-]+\.(?:md|py|tex|json|sty|bib|csv|yaml|sh|js))\b/g)].map((match) => match[1]));
    for (const path of named) {
      checked++;
      if (elsewhere.has(`${name}:${path}`)) continue;
      try { await stat(join(root, SKILLS, name, path)); } catch { missing.push(`${name}:${path}`); }
    }
  }
  assert.deepEqual(missing, []);
  assert(checked > 1500, `${checked} named paths`);
  for (const path of ["ml-paper-writing/references/citation-workflow.md", "pathway-enrichment/scripts/run_enrichment.py"]) await stat(join(root, SKILLS, path));
});

test("upstream license, notices and provenance are preserved and attributed", async () => {
  const source = (await json("sources.json")).sources.find((item) => item.id === SOURCE);
  assert.equal(source.repository, "KalarisLabs/research-agent-skills");
  assert.equal(source.license, "MIT");
  const lock = (await json("sources.lock.json")).sources[SOURCE];
  assert.equal(lock.commit, "b0ee35abfd7e26428846fbd84f282114560a5fbd");
  const tracked = new Set((await json("vendor-integrity.json")).files.map((file) => file.path));
  for (const path of ["LICENSE", "LICENSES/MIT-upstream-a.txt", "LICENSES/MIT-upstream-b.txt", "THIRD_PARTY_NOTICES.md", "third_party/upstream-manifest.json"]) {
    assert(source.licenseFiles.includes(path), path);
    assert(tracked.has(`${COLLECTION}/${path}`), path);
  }
  assert.match(await readFile(join(root, COLLECTION, "LICENSE"), "utf8"), /Copyright \(c\) 2026 Kalaris Labs/);
  assert.match(await readFile(join(root, COLLECTION, "LICENSES/MIT-upstream-a.txt"), "utf8"), /K-Dense Inc\./);
  assert.match(await readFile(join(root, COLLECTION, "LICENSES/MIT-upstream-b.txt"), "utf8"), /Claude AI Research Skills Contributors/);
  const notices = await readFile(join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
  assert(notices.includes(`https://github.com/KalarisLabs/research-agent-skills/tree/${lock.commit}`));
  assert(notices.includes("excludes `skills/autoskill/.gitignore`"), "the one excluded file is reported");
  assert.deepEqual(source.exclude.map((entry) => entry.path), ["skills/autoskill/.gitignore"]);
});

test("Markdown link targets follow CommonMark destinations", () => {
  assert.deepEqual(localLinkTargets("[a](missing.md) [b](docs/x.md#part) [c](https://example.com) ![i](img.png)"), ["missing.md", "docs/x.md"]);
  assert.deepEqual(localLinkTargets(`[t](ref.md "Title") [u](<with space.md> "T") [v](<a b.md>) [w](q.md 'single')`), ["ref.md", "with space.md", "a b.md", "q.md"]);
  assert.deepEqual(localLinkTargets("[2, 4, 6](like in compression/config.json)"), [], "prose in brackets is not a link");
  assert.deepEqual(localLinkTargets("```\n[x](in-code.md)\n```\n[y](after.md)"), ["after.md"]);
  assert.deepEqual(localLinkTargets("[p](/abs.md) [q]({placeholder}) [r](?only=query)"), []);
});

test("npm packs every tracked vendor file and preserved notice", { timeout: 120_000 }, async (t) => {
  let output;
  try {
    ({ stdout: output } = await promisify(execFile)("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, maxBuffer: 64 * 1024 * 1024 }));
  } catch (error) {
    if (error?.code === "ENOENT") return t.skip("npm is not on PATH");
    throw error;
  }
  const packed = new Set(JSON.parse(output)[0].files.map((file) => file.path));
  const missing = (await json("vendor-integrity.json")).files.map((file) => file.path).filter((path) => !packed.has(path));
  assert.deepEqual(missing, []);
  for (const path of ["skills/wb-research/SKILL.md", "catalog.json", "THIRD_PARTY_NOTICES.md", "scripts/markdown_links.mjs", "docs/WORKFLOWS.ko.md"]) assert(packed.has(path), path);
});
