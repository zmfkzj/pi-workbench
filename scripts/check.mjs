import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROFILE_IDS, readCatalog, resolveSkillPath } from "../lib/runtime.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));
const catalog = await readCatalog(root);
const manifest = await json("package.json");
const integrity = await json("vendor-integrity.json");
const sources = await json("sources.json");
const locks = await json("sources.lock.json");
assert.deepEqual(manifest.pi, { extensions: ["./index.js"], skills: ["./skills"] });
assert.deepEqual(manifest.omp, { extensions: ["./index.js"] });
assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0, "The extension has no runtime npm dependencies.");
assert(!manifest.scripts.preinstall && !manifest.scripts.install && !manifest.scripts.postinstall, "No installation scripts.");
assert.deepEqual(catalog.profiles.map((p) => p.id).sort(), [...PROFILE_IDS].sort());
assert.equal(new Set(catalog.skills.map((s) => s.id)).size, catalog.skills.length);
const ids = new Set(catalog.skills.map((s) => s.id));
for (const profile of catalog.profiles) {
  assert(profile.skills.length > 0);
  assert(profile.skills.every((id) => ids.has(id)), `Unknown skill in ${profile.id}`);
  const route = await readFile(join(root, "skills", `wb-${profile.id}`, "SKILL.md"), "utf8");
  assert(route.startsWith(`---\nname: wb-${profile.id}\n`));
  for (const id of profile.skills) assert(route.includes(catalog.skills.find((s) => s.id === id).path));
}
const profileIds = new Set(catalog.profiles.map((p) => p.id));
for (const skill of catalog.skills) {
  await resolveSkillPath(root, skill.path);
  assert.match(skill.source.commit, /^[0-9a-f]{40}$/);
  assert.equal(skill.source.commit, locks.sources[skill.sourceId].commit);
  assert(skill.notes.length > 0 && Array.isArray(skill.dependencies));
  assert(Array.isArray(skill.profiles) && skill.profiles.length > 0, `Missing profiles for ${skill.id}`);
  for (const id of skill.profiles) assert(profileIds.has(id), `Unknown profile ${id} declared by ${skill.id}`);
  const declared = [...new Set(skill.profiles)].sort();
  assert.equal(declared.length, skill.profiles.length, `Duplicate profile declared by ${skill.id}`);
  const listed = catalog.profiles.filter((p) => p.skills.includes(skill.id)).map((p) => p.id).sort();
  assert.deepEqual(declared, listed, `Profile membership differs for ${skill.id}: skill declares ${declared.join(",")}, profiles list ${listed.join(",")}`);
}
const tracked = new Set();
for (const file of integrity.files) {
  assert(!tracked.has(file.path), `Duplicate integrity entry ${file.path}`);
  tracked.add(file.path);
  const path = await resolveSkillPath(root, file.path);
  const data = await readFile(path);
  assert.equal(data.length, file.bytes, file.path);
  assert.equal(createHash("sha256").update(data).digest("hex"), file.sha256, file.path);
  assert.equal(createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex"), file.gitBlob, file.path);
  if (file.aliasOf) assert(data.equals(await readFile(join(root, file.aliasOf))), `Alias differs: ${file.path}`);
}
for (const source of sources.sources) {
  assert.equal(locks.sources[source.id].repository, source.repository);
  for (const path of source.licenseFiles) assert(tracked.has(`vendor/${source.id}/${path}`), `License missing: ${source.id}/${path}`);
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.name === "__pycache__" || entry.name === "node_modules") continue;
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
    else assert.fail(`Unexpected non-file entry ${path}`);
  }
  return files;
}
const vendorFiles = await walk(join(root, "vendor"));
for (const path of vendorFiles) assert(tracked.has(path.slice(root.length + 1).replaceAll("\\", "/")), `Untracked vendor file ${path}`);
let checkedLinks = 0;
const markdown = [join(root, "SKILL.md"), ...await walk(join(root, "skills")), ...await walk(join(root, "docs")), ...vendorFiles].filter((p) => p.endsWith(".md"));
for (const path of markdown) {
  const body = (await readFile(path, "utf8")).replace(/```[\s\S]*?```/g, "");
  for (const match of body.matchAll(/(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
    const target = match[1].split(' "')[0].replace(/^<|>$/g, "").split(/[?#]/)[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("/") || /[{}*<>]/.test(target)) continue;
    let exists = true;
    try { await stat(resolve(dirname(path), decodeURIComponent(target))); } catch { exists = false; }
    assert(exists, `Broken local Markdown reference: ${path} -> ${target}`);
    checkedLinks++;
  }
}
console.log(JSON.stringify({ ok: true, profiles: catalog.profiles.length, selectableSkills: catalog.skills.length, upstreamFiles: integrity.files.length, compatibilityAliases: integrity.files.filter((f) => f.aliasOf).length, localMarkdownLinks: checkedLinks, vendorBytes: integrity.files.reduce((n, f) => n + f.bytes, 0) }, null, 2));
