// Modern Web Guidance (GoogleChrome/modern-web-guidance) and Archify (tt-a1i/archify): registered in the coding and
// analysis profiles with their original SKILL.md files, the files those skills name are bundled, the documented exclusions
// and the CLI opt-in gate stay accurate, licenses and notices are kept, and the bundled Archify CLI runs from the package.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { profileGuidance, readCatalog, readSkill, skillSelectionText } from "../lib/runtime.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const json = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));
const MWG = "vendor/modern-web-guidance";
const GUIDES = `${MWG}/skills/modern-web-guidance/guides`;
const ARCHIFY = "vendor/archify/archify";
const COMMITS = {
  "modern-web-guidance": "4dd968349e54ca45a05dd5c818fb035c9054b022",
  archify: "e37848822238e3a61b12739185cdadd49843a620",
};
const SKILLS = {
  "modern-web-guidance": { sourceId: "modern-web-guidance", sourcePath: "skills/modern-web-guidance", profiles: ["coding"] },
  "chrome-extensions": { sourceId: "modern-web-guidance", sourcePath: "skills/chrome-extensions", profiles: ["coding"] },
  archify: { sourceId: "archify", sourcePath: "archify", profiles: ["coding", "analysis"] },
};

const frontmatterName = (text) => /^name: *(\S+?)\s*$/m.exec(/^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "")?.[1];
const walk = async (directory) => (await readdir(directory, { withFileTypes: true, recursive: true }))
  .filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));

test("the three skills are catalog entries pointing at the original upstream SKILL.md at the locked commit", async () => {
  const catalog = await readCatalog(root);
  const locks = (await json("sources.lock.json")).sources;
  for (const [id, expected] of Object.entries(SKILLS)) {
    const skill = catalog.skills.find((item) => item.id === id);
    assert(skill, id);
    assert.equal(skill.sourceId, expected.sourceId, id);
    assert.equal(skill.sourcePath, expected.sourcePath, id);
    assert.deepEqual(skill.profiles, expected.profiles, id);
    assert.equal(skill.path, `vendor/${expected.sourceId}/${expected.sourcePath}/SKILL.md`, id);
    assert.equal(frontmatterName(await readFile(join(root, skill.path), "utf8")), id, "the bundled file is the upstream skill itself");
    assert.equal(locks[expected.sourceId].commit, COMMITS[expected.sourceId]);
    assert.equal(skill.source.url, `https://github.com/${skill.source.repository}/blob/${COMMITS[expected.sourceId]}/${expected.sourcePath}/SKILL.md`);
    for (const profile of expected.profiles) {
      assert(catalog.profiles.find((item) => item.id === profile).skills.includes(id), `${profile} lists ${id}`);
      const route = await readFile(join(root, "skills", `wb-${profile}`, "SKILL.md"), "utf8");
      assert(route.includes(`](../../${skill.path})`), `wb-${profile} links ${id}`);
    }
  }
});

test("the coding and analysis profile guidance carries the new skill locations and stays small", async () => {
  const catalog = await readCatalog(root);
  const coding = await profileGuidance(root, catalog, "coding");
  for (const id of Object.keys(SKILLS)) assert(coding.includes(JSON.stringify(join(root, catalog.skills.find((s) => s.id === id).path))), id);
  assert(coding.includes("DISABLE_TELEMETRY=1") && coding.includes("ARCHIFY_CHROME"), "notes reach the profile guidance");
  assert(Buffer.byteLength(coding) < 12_000, `coding guidance is ${Buffer.byteLength(coding)} bytes`);
  const analysis = await profileGuidance(root, catalog, "analysis");
  assert(analysis.includes(JSON.stringify(join(root, ARCHIFY, "SKILL.md"))));
  assert(!analysis.includes("modern-web-guidance/SKILL.md"), "web guidance stays out of the analysis profile");
});

test("a one-shot selection passes the original SKILL.md with its base directory, notes and dependencies", async () => {
  const catalog = await readCatalog(root);
  for (const id of Object.keys(SKILLS)) {
    const skill = catalog.skills.find((item) => item.id === id);
    const selection = await readSkill(root, skill);
    assert.equal(selection.baseDir, join(root, skill.path.slice(0, -"/SKILL.md".length)));
    const text = skillSelectionText([selection], root);
    assert(text.includes(`Base directory: ${JSON.stringify(selection.baseDir)}`));
    assert(text.includes(selection.raw));
    for (const note of skill.notes) assert(text.includes(`- ${note}`), `${id} note`);
    for (const item of skill.dependencies) assert(text.includes(`- ${item}`), `${id} dependency`);
  }
});

test("files the bundled skills name by relative path exist beside their SKILL.md", async () => {
  const pattern = /(?<![\w/.-])((?:references|schemas|examples|assets|bin|scripts)\/[\w./-]+\.(?:md|json|html|mjs))\b/g;
  let checked = 0;
  for (const [base, files] of [
    [`${MWG}/skills/chrome-extensions`, ["SKILL.md"]],
    [ARCHIFY, ["SKILL.md", ...(await readdir(join(root, ARCHIFY, "references"))).map((name) => `references/${name}`)]],
  ]) {
    for (const file of files) {
      for (const [, path] of (await readFile(join(root, base, file), "utf8")).matchAll(pattern)) {
        await stat(join(root, base, path));
        checked++;
      }
    }
  }
  assert(checked > 60, `${checked} named paths`);
});

test("the upstream README indexes the bundled guides, and the documented opt-in gate names bundled guides", async () => {
  const readme = await readFile(join(root, MWG, "README.md"), "utf8");
  assert.match(readme, /guide content under `guides\/` are licensed under \[Creative Commons Attribution 4\.0/);
  const links = [...readme.matchAll(/\[([\w-]+)\]\(https:\/\/github\.com\/GoogleChrome\/modern-web-guidance\/blob\/main\/skills\/modern-web-guidance\/guides\/([\w-]+)\/([\w-]+)\.md\)/g)];
  assert(links.length > 200, `${links.length} indexed guides`);
  for (const [, id, category, file] of links) {
    assert.equal(id, file, "the index names each guide by its file name");
    await stat(join(root, GUIDES, category, `${file}.md`));
  }
  const tracked = new Set((await json("vendor-integrity.json")).files.map((file) => file.path));
  const guides = (await walk(join(root, GUIDES))).map((path) => path.slice(root.length).replaceAll("\\", "/"));
  assert.equal(guides.length, 209);
  for (const path of guides) assert(tracked.has(path), path);
  // docs/ADAPTERS.md lists the guides `retrieve` gates behind .mwgrc in CLI 1.0.0; each must be a bundled guide file.
  const adapters = await readFile(join(root, "docs/ADAPTERS.md"), "utf8");
  const gated = [...adapters.matchAll(/^- (?:Origin Trial|Volatile features) \([^)]*\): (.+)$/gm)].flatMap((match) => [...match[1].matchAll(/`([\w-]+)`/g)].map((m) => m[1]));
  assert.equal(gated.length, 18);
  const stems = new Set(guides.map((path) => path.split("/").at(-1).slice(0, -3)));
  for (const id of gated) assert(stems.has(id), `gated guide ${id}`);
});

test("only Archify's prebuilt example renderings are excluded, and nothing the skill uses names them", async () => {
  const source = (await json("sources.json")).sources.find((item) => item.id === "archify");
  const excluded = source.exclude.map((entry) => entry.path);
  assert.equal(excluded.length, 15);
  for (const path of excluded) {
    assert.match(path, /^archify\/examples\/[\w-]+\.html$/);
    await assert.rejects(stat(join(root, "vendor/archify", path)), { code: "ENOENT" });
  }
  const names = excluded.map((path) => path.split("/").at(-1));
  for (const path of await walk(join(root, ARCHIFY))) {
    if (path.endsWith("scripts/render-examples.mjs")) continue; // the maintainer script that regenerates them
    let text = await readFile(path, "latin1");
    // A JSON example's meta.output is where rendering it would write; it is an output path, not something read.
    if (path.endsWith(".json") && path.includes("/examples/")) text = text.replace(/"output": "(?:examples\/)?[\w-]+\.html"/g, "");
    for (const name of names) assert(!text.includes(name), `${path} names ${name}`);
  }
  for (const path of ["examples/web-app.architecture.json", "schemas/architecture.schema.json", "assets/template.html"]) await stat(join(root, ARCHIFY, path));
});

test("licenses, NOTICE files and provenance of both sources are preserved and attributed", async () => {
  const sources = (await json("sources.json")).sources;
  const tracked = new Set((await json("vendor-integrity.json")).files.map((file) => file.path));
  const notices = await readFile(join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
  const expected = {
    "modern-web-guidance": { repository: "GoogleChrome/modern-web-guidance", license: "Apache-2.0 AND CC-BY-4.0", files: ["LICENSE", "README.md"] },
    archify: { repository: "tt-a1i/archify", license: "Apache-2.0", files: ["archify/LICENSE", "archify/LICENSE-MIT", "archify/NOTICE", "archify/THIRD_PARTY_NOTICES.md", "archify/assets/JetBrainsMono-OFL.txt", "archify/explainer/vendor/pele/LICENSE"] },
  };
  for (const [id, want] of Object.entries(expected)) {
    const source = sources.find((item) => item.id === id);
    assert.equal(source.repository, want.repository);
    assert.equal(source.license, want.license);
    assert.deepEqual(source.licenseFiles, want.files);
    for (const path of want.files) assert(tracked.has(`vendor/${id}/${path}`), path);
    assert(notices.includes(`https://github.com/${want.repository}/tree/${COMMITS[id]}`), `${id} notice row`);
    assert(notices.includes(`- **${id}**: ${source.licenseEvidence}`), `${id} license evidence`);
  }
  assert.match(await readFile(join(root, MWG, "LICENSE"), "utf8"), /Apache License\s+Version 2\.0/);
  const notice = await readFile(join(root, ARCHIFY, "NOTICE"), "utf8");
  assert.match(notice, /Copyright \(c\) 2026 tt-a1i \(Archify\)/);
  assert.match(notice, /Copyright \(c\) 2025 Cocoon AI/);
  assert.match(await readFile(join(root, ARCHIFY, "LICENSE-MIT"), "utf8"), /^MIT License/);
  assert.match(await readFile(join(root, ARCHIFY, "explainer/vendor/pele/LICENSE"), "utf8"), /MIT License/);
  assert.match(await readFile(join(root, ARCHIFY, "assets/JetBrainsMono-OFL.txt"), "utf8"), /SIL OPEN FONT LICENSE/i);
  assert(notices.includes("**CC-BY-4.0**") && notices.includes("CC-BY-NC-SA-4.0"), "license boundaries name the guide and brand-mark terms");
});

test("the bundled Archify CLI runs from the package: doctor passes and demo reproduces the excluded web-app rendering", { timeout: 120_000 }, async (t) => {
  const run = promisify(execFile);
  const env = { ...process.env, ARCHIFY_UPDATE_CHECK_DISABLED: "1" };
  const cli = join(root, ARCHIFY, "bin/archify.mjs");
  assert((await stat(cli)).mode & 0o100, "the upstream executable bit is kept");
  const doctor = await run(process.execPath, [cli, "doctor"], { env, maxBuffer: 8 * 1024 * 1024 });
  assert.match(doctor.stdout, /Archify is ready\./);
  const directory = await mkdtemp(join(tmpdir(), "pi-workbench-archify-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await run(process.execPath, [cli, "demo", directory], { cwd: directory, env, maxBuffer: 8 * 1024 * 1024 });
  const html = await readFile(join(directory, "archify-demo.html"));
  // Git blob of archify/examples/web-app-rendered.html at the locked commit (excluded from the bundle).
  assert.equal(createHash("sha1").update(`blob ${html.length}\0`).update(html).digest("hex"), "5e4c94c0900ec60812eaa88b300d26cac405dd55");
});
