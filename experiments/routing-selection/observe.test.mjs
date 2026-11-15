// Regression checks of the routing-selection event accounting (observe.mjs): only successful calls count, the
// research index counts through a read or a grep that returned its lines, wrong paths are invalid-path attempts,
// and prompt tokens keep input and cache separate. Run: npm run test:measurement
import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { classify, createObserver, grepReturnedIndex, resolvePath } from "./observe.mjs";

const pkgDir = "/scratch/pkgs/abc/pi-workbench";
const cwd = "/scratch/runs/r1/work";
const home = "/scratch/runs/r1/home";
const pkg = {
  dir: pkgDir,
  catalog: { skills: [
    { id: "research-agent-skills", path: "vendor/research-agent-skills/skills/research-agent-skills/SKILL.md" },
    { id: "statistical-power", path: "vendor/research-agent-skills/skills/statistical-power/SKILL.md" },
    { id: "archify", path: "vendor/archify/archify/SKILL.md" },
  ] },
};
const INDEX = join(pkgDir, "vendor/research-agent-skills/skills/research-agent-skills/references/catalog.md");
const request = { profiles: ["research"], skills: ["research-agent-skills"], specialist: "etetoolkit" };

/** Replays start/end pairs: [toolName, args, { isError, text }]. */
function replay(calls, extra = []) {
  const observer = createObserver({ pkg, cwd, home });
  calls.forEach(([toolName, args, end = {}], i) => {
    observer.handle({ type: "tool_execution_start", toolCallId: `c${i}`, toolName, args });
  });
  // Ends arrive in completion order, here reversed, and are paired by toolCallId.
  [...calls.entries()].reverse().forEach(([i, [toolName, , end = {}]]) => {
    if (end.pending) return;
    observer.handle({ type: "tool_execution_end", toolCallId: `c${i}`, toolName, isError: Boolean(end.isError), result: { content: [{ type: "text", text: end.text ?? "ok" }] } });
  });
  for (const event of extra) observer.handle(event);
  return observer.summary(request);
}

test("classify keeps package paths and rejects paths outside the package", () => {
  assert.deepEqual(classify(join(pkgDir, "skills/wb-research/SKILL.md"), pkg), { router: "research" });
  assert.deepEqual(classify(join(pkgDir, "skills/statistical-power/SKILL.md"), pkg), { wrapper: "statistical-power" });
  assert.deepEqual(classify(join(pkgDir, "vendor/research-agent-skills/skills/statistical-power/SKILL.md"), pkg), { skill: "statistical-power" });
  assert.deepEqual(classify(join(pkgDir, "vendor/research-agent-skills/skills/etetoolkit/SKILL.md"), pkg), { specialist: "etetoolkit" });
  assert.deepEqual(classify(INDEX, pkg), { researchIndex: true });
  assert.deepEqual(classify(join(pkgDir, "vendor/quality-engineering/skills/x/child/SKILL.md"), pkg), { skill: "child", uncatalogued: true });
  assert.equal(classify("/scratch/pkgs/abc/pi-workbench-other/skills/wb-research/SKILL.md", pkg), null, "a sibling directory with the same prefix is outside");
  assert.equal(classify(join(cwd, "notes.md"), pkg), null);
  assert.equal(resolvePath("~/x", cwd, home), join(home, "x"));
  assert.equal(resolvePath("../work/a", cwd, home), join(cwd, "a"));
  assert.equal(resolvePath("@/abs/p", cwd, home), "/abs/p");
});

test("only successful reads count; failed reads of wrong paths are invalid-path attempts", () => {
  const summary = replay([
    ["read", { path: join(pkgDir, "skills/wb-research/SKILL.md") }],
    ["read", { path: join(pkgDir, "skills/wb-research/references/catalog.md") }, { isError: true, text: "ENOENT: no such file or directory, access '…'" }],
    ["read", { path: join(pkgDir, "vendor/research-agent-skills/skills/no-such-skill/SKILL.md") }, { isError: true, text: "ENOENT: no such file" }],
    ["read", { path: join(pkgDir, "vendor/research-agent-skills/skills/etetoolkit/SKILL.md") }],
    ["ls", { path: "missing-dir" }, { isError: true, text: "Path not found: /scratch/runs/r1/work/missing-dir" }],
  ]);
  assert.deepEqual(summary.routers, ["research"]);
  assert.deepEqual(summary.specialists, ["etetoolkit"], "the failed read of a nonexistent specialist is not a specialist");
  assert.equal(summary.specialistHit, true);
  assert.equal(summary.researchIndex, false, "a failed read of a wrong index path is not index use");
  assert.equal(summary.invalidPaths.length, 3);
  assert(summary.invalidPaths.includes(join(cwd, "missing-dir")), "relative paths resolve against the working directory");
  assert.equal(summary.toolCalls, 5);
});

test("an unfinished call does not count as opened", () => {
  const summary = replay([["read", { path: INDEX }, { pending: true }]]);
  assert.equal(summary.researchIndexRead, false);
  assert.equal(summary.unfinishedCalls, 1);
});

test("the research index counts through a successful read or a grep that returned its lines", () => {
  assert.equal(replay([["read", { path: INDEX }]]).researchIndexRead, true);
  const fileHit = replay([["grep", { path: INDEX, pattern: "phylogen" }, { text: "catalog.md:120: - `etetoolkit` — phylogenetic trees" }]]);
  assert.equal(fileHit.researchIndexGrep, true);
  assert.equal(fileHit.researchIndex, true);
  assert.equal(fileHit.researchIndexRead, false, "grep use is kept apart from opening the file");
  const fileMiss = replay([["grep", { path: INDEX, pattern: "zzz" }, { text: "No matches found" }]]);
  assert.equal(fileMiss.researchIndexGrep, false);
  assert.equal(fileMiss.researchIndexGrepAttempts, 1);
  const dir = join(pkgDir, "vendor/research-agent-skills/skills");
  const dirHit = replay([["grep", { path: dir, pattern: "phylogen" }, { text: "research-agent-skills/references/catalog.md:120: - `etetoolkit`\netetoolkit/SKILL.md:3: description" }]]);
  assert.equal(dirHit.researchIndexGrep, true);
  const dirOther = replay([["grep", { path: dir, pattern: "phylogen" }, { text: "etetoolkit/SKILL.md:3: description" }]]);
  assert.equal(dirOther.researchIndexGrep, false, "a directory grep without index lines is not index use");
  const outside = replay([["grep", { path: join(pkgDir, "skills/wb-research/references/catalog.md"), pattern: "x" }, { isError: true, text: "Path not found: …" }]]);
  assert.equal(outside.researchIndexGrep, false);
  assert.equal(outside.invalidPaths.length, 1);
  assert.equal(grepReturnedIndex("/elsewhere", "research-agent-skills/references/catalog.md:1: x", pkgDir), false);
});

test("usage keeps prompt input and cache apart, sums cost and flags a missing cost", () => {
  const message = (usage, text = "") => ({ type: "message_end", message: { role: "assistant", usage, content: [{ type: "text", text }] } });
  const summary = replay([], [
    message({ input: 120, output: 40, cacheRead: 9000, cacheWrite: 300, cost: { total: 0.01 } }),
    message({ input: 50, output: 400, cacheRead: 9300, cacheWrite: 0 }, "final answer"),
  ]);
  assert.equal(summary.usage.firstPromptTokens, 9420);
  assert.equal(summary.usage.input, 170);
  assert.equal(summary.usage.cacheRead, 18300);
  assert.equal(summary.usage.cacheWrite, 300);
  assert.equal(summary.cost, 0.01);
  assert.equal(summary.costMissing, true, "a message without a cost is not counted as free");
  assert.equal(summary.finalText, "final answer");
});

test("Archify CLI runs and finalize gates are recorded; negative requests report avoided skills", () => {
  const observer = createObserver({ pkg, cwd, home });
  const calls = [
    ["read", { path: join(pkgDir, "vendor/archify/archify/SKILL.md") }, "ok", false],
    ["bash", { command: `node ${pkgDir}/vendor/archify/archify/bin/archify.mjs finalize sequence d.json d.html` }, "finalize fail: d.html\ngates validate:pass", false],
    ["bash", { command: `node ${pkgDir}/vendor/archify/archify/bin/archify.mjs finalize sequence d.json d.html` }, "finalize pass: d.html", false],
    ["write", { path: "d.json" }, "ok", false],
  ];
  calls.forEach(([toolName, args, text, isError], i) => {
    observer.handle({ type: "tool_execution_start", toolCallId: `${i}`, toolName, args });
    observer.handle({ type: "tool_execution_end", toolCallId: `${i}`, toolName, isError, result: { content: [{ type: "text", text }] } });
  });
  const summary = observer.summary({ profiles: ["coding"], skills: [], avoidSkills: ["archify"] });
  assert.equal(summary.skillHit, null, "a negative request has no acceptable skill");
  assert.deepEqual(summary.avoidedSkillOpened, ["archify"]);
  assert.equal(summary.archifyCommands, 2);
  assert.equal(summary.finalizePassed, 1);
  assert.equal(summary.finalizeFailed, 1);
  assert.deepEqual(summary.written, [join(cwd, "d.json")]);
});

test("every request scenario of tests/routing-requests.json is runnable: tools, fixture and limits", async () => {
  const { readFile, stat } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const here = fileURLToPath(new URL(".", import.meta.url));
  const { scenarios, requests } = JSON.parse(await readFile(join(here, "../../tests/routing-requests.json"), "utf8"));
  const known = new Set(["read", "bash", "edit", "write", "grep", "find", "ls"]);
  for (const [name, scenario] of Object.entries(scenarios)) {
    for (const tool of scenario.tools.split(",")) assert(known.has(tool), `${name}: tool ${tool}`);
    assert(scenario.maxTools > 0 && scenario.timeLimit > 0 && scenario.runCostCap > 0, `${name} limits`);
    if (scenario.fixture) assert((await stat(join(here, "fixtures", scenario.fixture))).isDirectory(), `${name} fixture`);
    if (scenario.browser) assert(scenario.tools.includes("bash") && scenario.tools.includes("write"), `${name}: a browser is only useful with bash and write`);
  }
  for (const request of requests) assert(scenarios[request.scenario ?? "readonly"], request.id);
});
