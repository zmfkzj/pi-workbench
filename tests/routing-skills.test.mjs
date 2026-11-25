// Routing metadata: the eight native routing skills carry request-oriented descriptions within Pi's limits, the four
// Quality-Engineering child skills (Is/Is-Not, 5-Why, Fishbone, 8D report writing) are catalog entries with the same
// discovery and explicit-selection paths as the other bundled skills, and the representative requests in
// tests/routing-requests.json map onto routing wording and catalog membership.
// These are structural checks of metadata only; they do not measure which skill a model actually selects
// (see experiments/routing-selection for that measurement).
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { completeWorkbenchArguments, profileGuidance, readCatalog, readSkill, skillSelectionText } from "../lib/runtime.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const json = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));
const QE_COMMIT = "70df27cbd6a5ad6808499e934d2c72be4f8bef1e";
const QE = {
  "is-is-not-scoping": { sourcePath: "skills/problem-solving/is-is-not-scoping", profiles: ["manufacturing", "analysis"] },
  "5why-root-cause": { sourcePath: "skills/problem-solving/5why-root-cause", profiles: ["manufacturing", "analysis"] },
  "fishbone-analysis": { sourcePath: "skills/problem-solving/fishbone-analysis", profiles: ["manufacturing", "analysis"] },
  "8d-report-writing": { sourcePath: "skills/documentation/8d-report-writing", profiles: ["manufacturing"] },
};
/** Pi's frontmatter fields of a generated routing skill (name and the JSON-quoted description line). */
const frontmatter = (text) => {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
  return { name: /^name: (.+)$/m.exec(block)?.[1], description: JSON.parse(/^description: (.+)$/m.exec(block)?.[1] ?? "null") };
};
const route = async (id) => readFile(join(root, "skills", `wb-${id}`, "SKILL.md"), "utf8");

test("routing descriptions are generated from the catalog, name requests and stay within Pi's limits", async () => {
  const catalog = await readCatalog(root);
  let total = 0;
  for (const profile of catalog.profiles) {
    assert(typeof profile.routing === "string" && profile.routing.trim().length > 40, `${profile.id} routing text`);
    const { name, description } = frontmatter(await route(profile.id));
    assert.equal(name, `wb-${profile.id}`);
    assert.equal(description, `${profile.title}. ${profile.description}. ${profile.routing} Use for the ${profile.id} workflow; select only relevant bundled skills and their references.`);
    assert(description.length <= 1024, `wb-${profile.id} description has ${description.length} characters`);
    total += description.length;
  }
  // Every routing description is in every system prompt: keep the eight together small.
  assert(total < 3_000, `routing descriptions total ${total} characters`);
});

test("the native skill surface stays the eight routing skills", async () => {
  const manifest = await json("package.json");
  assert.deepEqual(manifest.pi.skills, ["./skills"]);
  const catalog = await readCatalog(root);
  const directories = (await readdir(join(root, "skills"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.deepEqual(directories, catalog.profiles.map((profile) => `wb-${profile.id}`).sort(), "no direct wrapper or vendor skill under skills/");
});

test("the four Quality-Engineering child skills are catalog entries for their original SKILL.md at the locked commit", async () => {
  const catalog = await readCatalog(root);
  const locks = (await json("sources.lock.json")).sources;
  const source = (await json("sources.json")).sources.find((item) => item.id === "quality-engineering");
  assert.equal(locks["quality-engineering"].commit, QE_COMMIT);
  assert.equal(source.license, "MIT");
  const tracked = new Set((await json("vendor-integrity.json")).files.map((file) => file.path));
  const notices = await readFile(join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
  assert(notices.includes(`https://github.com/RBraga01/Quality-Engineering-Skills/tree/${QE_COMMIT}`), "notice row");
  assert(tracked.has("vendor/quality-engineering/LICENSE"));
  for (const [id, expected] of Object.entries(QE)) {
    const skill = catalog.skills.find((item) => item.id === id);
    assert(skill, id);
    assert(source.include.includes(expected.sourcePath), `${id} is a bundled path of the source`);
    assert.equal(skill.sourceId, "quality-engineering");
    assert.equal(skill.sourcePath, expected.sourcePath);
    assert.equal(skill.path, `vendor/quality-engineering/${expected.sourcePath}/SKILL.md`);
    assert(tracked.has(skill.path), `${id} SKILL.md is an integrity-tracked vendor file`);
    assert.equal(/^name: (\S+)$/m.exec(await readFile(join(root, skill.path), "utf8"))?.[1], id, "the catalog id is the upstream skill name");
    assert.deepEqual(skill.source, {
      repository: "RBraga01/Quality-Engineering-Skills", path: `${expected.sourcePath}/SKILL.md`, commit: QE_COMMIT, license: "MIT",
      url: `https://github.com/RBraga01/Quality-Engineering-Skills/blob/${QE_COMMIT}/${expected.sourcePath}/SKILL.md`,
    });
    assert.deepEqual(skill.profiles, expected.profiles);
    assert(skill.notes.length > 0 && skill.dependencies.length === 0, id);
    for (const profile of catalog.profiles) {
      const text = await route(profile.id);
      const listed = expected.profiles.includes(profile.id);
      assert.equal(profile.skills.includes(id), listed, `${profile.id} membership of ${id}`);
      assert.equal(text.includes(`](../../${skill.path})`), listed, `wb-${profile.id} table link for ${id}`);
      if (listed) assert(text.includes(`- **${id}**: ${skill.notes.join(" ")}`), `wb-${profile.id} notes for ${id}`);
    }
  }
});

test("the new entries keep the Pi guidance on evidence, candidates and customer actions", async () => {
  const catalog = await readCatalog(root);
  const notes = (id) => catalog.skills.find((skill) => skill.id === id).notes.join(" ");
  assert.match(notes("5why-root-cause"), /다섯 단계나 단일 원인을 강제하지 않는다/);
  assert.match(notes("fishbone-analysis"), /원인 후보다\. 확정 원인으로 보고하지 않/);
  assert.match(notes("is-is-not-scoping"), /사실로 채우지 않/);
  assert.match(notes("8d-report-writing"), /완료형으로 쓰지 않/);
  assert.match(notes("8d-report-writing"), /제출·서명·통지는 사용자가 직접/);
  assert.match(catalog.profiles.find((profile) => profile.id === "manufacturing").guidance, /8D Report Writing only for a customer-facing report draft/);
});

test("profile guidance, one-shot selection and completion reach the four skills", async () => {
  const catalog = await readCatalog(root);
  for (const profile of ["manufacturing", "analysis"]) {
    const guidance = await profileGuidance(root, catalog, profile);
    for (const [id, expected] of Object.entries(QE)) {
      const path = JSON.stringify(join(root, catalog.skills.find((skill) => skill.id === id).path));
      assert.equal(guidance.includes(path), expected.profiles.includes(profile), `${profile} guidance and ${id}`);
    }
    assert(Buffer.byteLength(guidance) < 12_000, `${profile} guidance is ${Buffer.byteLength(guidance)} bytes`);
  }
  for (const id of Object.keys(QE)) {
    const skill = catalog.skills.find((item) => item.id === id);
    const selection = await readSkill(root, skill);
    assert.equal(selection.baseDir, join(root, skill.path.slice(0, -"/SKILL.md".length)));
    const text = skillSelectionText([selection], root);
    assert(text.includes(`Base directory: ${JSON.stringify(selection.baseDir)}`));
    assert(text.includes(selection.raw));
    for (const note of skill.notes) assert(text.includes(`- ${note}`), `${id} note`);
  }
  const values = (prefix) => completeWorkbenchArguments(prefix, catalog).map((item) => item.value);
  assert.deepEqual(values("skill 5w"), ["skill 5why-root-cause"]);
  assert.deepEqual(values("skill is-"), ["skill is-is-not-scoping"]);
  assert.deepEqual(values("skill fish"), ["skill fishbone-analysis"]);
  assert.deepEqual(values("skill 8d"), ["skill 8d-problem-solving", "skill 8d-report-writing"]);
});

test("the research index is named by a resolvable link and package path, not a routing-skill-relative path", async () => {
  const catalog = await readCatalog(root);
  const research = catalog.profiles.find((profile) => profile.id === "research");
  const indexPath = "vendor/research-agent-skills/skills/research-agent-skills/references/catalog.md";
  assert.deepEqual(research.indexes.map((index) => index.path), [indexPath]);
  await readFile(join(root, indexPath), "utf8");
  // The measured miss: a bare `references/catalog.md` resolved against skills/wb-research/.
  assert.doesNotMatch(research.guidance, /\(references\/catalog\.md\)/);
  const text = await route("research");
  assert(text.includes(`## Indexes\n\n- [Research Agent Skills index](../../${indexPath}) (package path \`${indexPath}\`)`), "generated link and package path");
  const note = catalog.skills.find((skill) => skill.id === "research-agent-skills").notes[0];
  assert(note.includes(`패키지 경로 ${indexPath}`), "the index skill's note names the package path");
  const guidance = await profileGuidance(root, catalog, "research");
  assert(guidance.includes(`- Research Agent Skills index: ${JSON.stringify(join(root, indexPath))}`), "/workbench use research names the absolute index path");
  const workflows = await readFile(join(root, "docs/WORKFLOWS.ko.md"), "utf8");
  assert(workflows.includes(`](../${indexPath})`), "WORKFLOWS links the index");
  for (const profile of catalog.profiles.filter((item) => item.id !== "research")) assert.equal(profile.indexes, undefined, profile.id);
});

test("representative requests map onto routing wording and catalog membership (structural, not model selection)", async () => {
  const catalog = await readCatalog(root);
  const { requests, scenarios } = await json("tests/routing-requests.json");
  assert.equal(new Set(requests.map((item) => item.id)).size, requests.length, "unique request ids");
  assert(scenarios.readonly && scenarios.readonly.tools === "read,grep,find,ls", "the default scenario stays the read-only routing measurement");
  assert(requests.length >= 28);
  const count = (test) => requests.filter(test).length;
  assert(count((item) => item.specialist && item.round === 2) >= 4, "specialists whose names the request does not suggest");
  assert(count((item) => item.skills.includes("statistical-power")) >= 5, "sample-size requests, Korean and English, explicit and indirect");
  assert(count((item) => item.avoidSkills?.includes("archify")) >= 2, "diagram requests where Archify should stay closed");
  const index = await readFile(join(root, "vendor/research-agent-skills/skills/research-agent-skills/references/catalog.md"), "utf8");
  for (const item of requests) {
    for (const id of item.profiles) assert(catalog.profiles.some((profile) => profile.id === id), `${item.id}: profile ${id}`);
    const { description } = frontmatter(await route(item.profiles[0]));
    for (const cue of item.cues) assert(description.includes(cue), `${item.id}: wb-${item.profiles[0]} description names "${cue}"`);
    for (const id of item.skills) {
      const skill = catalog.skills.find((entry) => entry.id === id);
      assert(skill, `${item.id}: skill ${id}`);
      assert(skill.profiles.some((profile) => item.profiles.includes(profile)), `${item.id}: ${id} is reachable from an acceptable profile`);
    }
    if (item.specialist) {
      assert.match(index, new RegExp(`\`${item.specialist}\``), `${item.id}: the research index lists ${item.specialist}`);
      await readFile(join(root, "vendor/research-agent-skills/skills", item.specialist, "SKILL.md"), "utf8");
    }
    if (item.scenario) assert(scenarios[item.scenario], `${item.id}: scenario ${item.scenario}`);
    // A negative request accepts no skill and names the skills that should stay closed.
    if (!item.skills.length) {
      assert(item.avoidSkills?.length, `${item.id}: a negative request lists avoidSkills`);
      for (const id of item.avoidSkills) assert(catalog.skills.some((entry) => entry.id === id), `${item.id}: avoided skill ${id}`);
    }
    if (item.round === 2) assert(item.heldOut && item.cues.length === 0, `${item.id}: round-2 requests are held out and carry no cues`);
  }
});

test("visual verification and capture notes point to pi-gui and gui: true (wb-coding, wb-game)", async () => {
  const coding = await readFile(join(root, "skills/wb-coding/SKILL.md"), "utf8");
  const game = await readFile(join(root, "skills/wb-game/SKILL.md"), "utf8");
  const note = (text, id) => text.split("\n").find((line) => line.startsWith(`- **${id}**:`)) ?? "";
  assert.match(note(coding, "frontend-design"), /시각 검수는 browser_\* 또는 pi-gui 비공개 데스크톱\(`\/skill:pi-gui`\).*`gui: true`/);
  for (const id of ["create-game-assets", "game-feel"]) assert.match(note(game, id), /pi-gui 비공개 데스크톱\(`\/skill:pi-gui`\).*orche_task에 `gui: true`/, id);
  // The routing skills name the pi-gui skill, not a sibling checkout path.
  assert.doesNotMatch(coding + game, /\.\.\/pi-gui|pi-gui\/skills/);
});
