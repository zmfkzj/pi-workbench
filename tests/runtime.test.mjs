import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import {
  STATE_TYPE,
  doctor,
  probeExecutable,
  readSkill,
  registerWorkbench,
  resolveSkillPath,
} from "../lib/runtime.js";

function state(mode) {
  return { type: "custom", customType: STATE_TYPE, data: { mode } };
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), "pi-workbench-runtime-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function fixture(t) {
  const temporary = await temporaryDirectory(t);
  const root = join(temporary, "bundle with spaces");
  const catalog = {
    schemaVersion: 1,
    profiles: [
      {
        id: "coding",
        title: "코딩",
        description: "작은 완전한 변경",
        guidance: "Use existing project conventions.",
        skills: ["minimal-code", "review"],
      },
      {
        id: "game",
        title: "게임",
        description: "실제 화면 검증",
        guidance: "Check the asset at native scale.",
        skills: ["game-art"],
      },
    ],
    skills: [
      {
        id: "minimal-code",
        name: "Minimal Code",
        description: "Inspect existing callers before changing code.",
        path: "vendor/minimal-code/SKILL.md",
        notes: ["Do not add host-specific hooks."],
        dependencies: ["Optional documentation provider"],
      },
      {
        id: "review",
        name: "Review",
        description: "Check actual failure cases.",
        path: "vendor/review/SKILL.md",
      },
      {
        id: "game-art",
        name: "Game Art",
        description: "Inspect visual references.",
        path: "vendor/game-art/SKILL.md",
      },
    ],
  };
  const raw = {
    "minimal-code": "---\r\nname: minimal-code\r\ndescription: A fixture.\r\n---\r\n"
      + "# 원본 RAW-CODING-BODY\nKeep this mode active for the whole session.\n"
      + "Read references/checklist.md; preserve \"quotes\" and whitespace.  \n",
    review: "---\nname: review\ndescription: Review fixture.\n---\nRAW-REVIEW-BODY\n",
    "game-art": "---\nname: game-art\ndescription: Art fixture.\n---\nRAW-GAME-BODY\n",
  };
  await mkdir(root, { recursive: true });
  for (const skill of catalog.skills) {
    const path = join(root, skill.path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, raw[skill.id]);
  }
  const references = join(root, "vendor/minimal-code/references");
  await mkdir(references);
  await writeFile(join(references, "checklist.md"), "Reference resolved from the skill directory.\n");
  await writeFile(join(root, "catalog.json"), JSON.stringify(catalog));
  return { temporary, root, catalog, raw };
}

function harness(root, initialBranch = []) {
  let branch = initialBranch;
  const commands = new Map();
  const hooks = new Map();
  const messages = [];
  const appends = [];
  const notifications = [];
  const pi = {
    registerCommand(name, definition) {
      assert.ok(!commands.has(name), "The extension must not register its command twice.");
      commands.set(name, definition);
    },
    on(name, handler) {
      assert.ok(!hooks.has(name), "A hook should be registered once.");
      hooks.set(name, handler);
    },
    appendEntry(customType, data) {
      const copied = structuredClone(data);
      appends.push({ customType, data: copied });
      branch.push({ type: "custom", customType, data: copied });
    },
    sendMessage(message, options) {
      messages.push({ message: structuredClone(message), options: structuredClone(options) });
    },
  };
  const ctx = {
    sessionManager: { getBranch: () => branch },
    ui: { notify: (message, level) => notifications.push({ message, level }) },
    isIdle: () => false,
  };
  registerWorkbench(pi, root);
  return {
    commands, hooks, messages, appends, notifications,
    switchBranch(entries) { branch = entries; },
    command(args) { return commands.get("workbench").handler(args, ctx); },
    beforeStart(event = {}) { return hooks.get("before_agent_start")(event, ctx); },
  };
}

test("registration has no startup messages, state writes, or dependency work", async (t) => {
  const temporary = await temporaryDirectory(t);
  const h = harness(join(temporary, "package-not-installed"));
  assert.deepEqual([...h.commands.keys()], ["workbench"]);
  assert.deepEqual([...h.hooks.keys()], ["before_agent_start"]);
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
  assert.deepEqual(h.notifications, []);
  assert.equal(await h.beforeStart({ systemPrompt: "Existing instructions" }), undefined);
  assert.deepEqual(h.notifications, [], "Default startup must not need a catalog or provider.");
});

test("active branch history restores the last valid state and keeps sibling branches independent", async (t) => {
  const f = await fixture(t);
  const main = [
    state("coding"),
    state("unknown-profile"),
    state(["game"]),
    { type: "custom", customType: STATE_TYPE, data: null },
    { type: "custom", customType: STATE_TYPE },
    { type: "custom", customType: "another-extension", data: { mode: "off" } },
    { type: "message", customType: STATE_TYPE, data: { mode: "game" } },
  ];
  const mainBefore = structuredClone(main);
  const sibling = [...structuredClone(main), state("game")];
  const h = harness(f.root, main);
  assert.match((await h.beforeStart()).message.content, /\(coding\)/);
  h.switchBranch(sibling);
  assert.match((await h.beforeStart()).message.content, /\(game\)/);
  await h.command("use off");
  assert.equal(await h.beforeStart(), undefined);
  h.switchBranch(main);
  assert.match((await h.beforeStart()).message.content, /\(coding\)/);
  await h.command("status");
  assert.equal(h.messages.at(-1).message.content, "Workbench profile: coding");
  assert.deepEqual(main, mainBefore, "Selecting a profile in a sibling must not rewrite its parent.");
  assert.equal(sibling.at(-1).data.mode, "off");
  assert.deepEqual(h.notifications, []);
});

test("list, filtered list, and use expose the catalog without initiating an agent turn", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root);
  await h.command("list");
  assert.match(h.messages.at(-1).message.content, /minimal-code/);
  assert.match(h.messages.at(-1).message.content, /review/);
  assert.match(h.messages.at(-1).message.content, /game-art/);
  await h.command("list game");
  assert.match(h.messages.at(-1).message.content, /game-art/);
  assert.doesNotMatch(h.messages.at(-1).message.content, /minimal-code|RAW-GAME-BODY/);
  await h.command("use coding");
  assert.deepEqual(h.appends, [{ customType: STATE_TYPE, data: { mode: "coding" } }]);
  await h.command("status");
  assert.equal(h.messages.at(-1).message.content, "Workbench profile: coding");
  await h.command("");
  assert.match(h.messages.at(-1).message.content, /\/workbench skill <id>/);
  assert.ok(h.messages.every(({ options }) => options.triggerTurn === false));
  assert.deepEqual(h.notifications, []);
});

test("one-shot loading preserves exact raw instructions, canonical base directory, and explicit scope", async (t) => {
  const f = await fixture(t);
  const loaded = await readSkill(f.root, f.catalog.skills[0]);
  assert.equal(loaded.raw, f.raw["minimal-code"]);
  assert.equal(loaded.path, await realpath(join(f.root, f.catalog.skills[0].path)));
  assert.equal(loaded.baseDir, dirname(loaded.path));
  const startMarker = "--- BEGIN ORIGINAL SKILL.md ---\n";
  const endMarker = "\n--- END ORIGINAL SKILL.md ---";
  const start = loaded.content.indexOf(startMarker) + startMarker.length;
  const end = loaded.content.lastIndexOf(endMarker);
  assert.ok(start >= startMarker.length && end > start);
  assert.equal(loaded.content.slice(start, end), f.raw["minimal-code"], "Do not normalize or rewrite upstream content.");
  assert.match(loaded.content, /next user request and its continuations/);
  assert.match(loaded.content, /does not change the Workbench profile/);
  assert.match(loaded.content, /whole session do not apply to this one-shot selection/);
  const baseLine = loaded.content.split("\n").find((line) => line.startsWith("Base directory: "));
  const baseDir = JSON.parse(baseLine.slice("Base directory: ".length));
  assert.equal(await readFile(join(baseDir, "references/checklist.md"), "utf8"), "Reference resolved from the skill directory.\n");
  assert.match(loaded.content, /Do not add host-specific hooks/);
  assert.match(loaded.content, /Optional documentation provider/);
  assert.match(loaded.content, /not installed or connected by this extension/);
});

test("skill selection uses the host next-turn queue even while busy, without changing profile state", async (t) => {
  const f = await fixture(t);
  const entries = [state("game")];
  const h = harness(f.root, entries);
  await h.command("skill minimal-code");
  assert.equal(h.messages.length, 1);
  const { message, options } = h.messages[0];
  assert.equal(message.customType, "pi-workbench.selected-skill");
  assert.equal(message.display, true);
  assert.deepEqual(options, { triggerTurn: false, deliverAs: "nextTurn" });
  assert.deepEqual(message.details, {
    skillId: "minimal-code",
    baseDir: dirname(await realpath(join(f.root, f.catalog.skills[0].path))),
  });
  assert.ok(message.content.includes(f.raw["minimal-code"]));
  assert.deepEqual(h.appends, []);
  assert.deepEqual(entries, [state("game")]);
  assert.equal(h.notifications.at(-1).level, "info");
  const subsequent = await h.beforeStart();
  assert.match(subsequent.message.content, /\(game\)/);
  assert.doesNotMatch(subsequent.message.content, /RAW-CODING-BODY|selected-skill/);
});

test("invalid commands and missing catalog selections report errors without queueing or persisting work", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root, [state("coding")]);
  for (const command of [
    "not-a-command", "skill", "skill absent", "list absent",
    "use", "use absent", "use vision", "use coding extra", "status extra",
  ]) {
    const count = h.notifications.length;
    await h.command(command);
    assert.equal(h.notifications.length, count + 1, command);
    assert.equal(h.notifications.at(-1).level, "error", command);
    assert.match(h.notifications.at(-1).message, /^Workbench:/);
  }
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
  assert.match((await h.beforeStart()).message.content, /\(coding\)/);
});

test("skill paths reject traversal, absolute paths, directories, and symlink escapes", async (t) => {
  const f = await fixture(t);
  const outside = join(f.temporary, "outside");
  await mkdir(outside);
  await writeFile(join(outside, "SKILL.md"), "External instructions must not be loaded.\n");
  for (const path of [
    "../outside/SKILL.md",
    "vendor/../../outside/SKILL.md",
    join(outside, "SKILL.md"),
    "vendor/minimal-code",
    "",
    null,
  ]) {
    await assert.rejects(resolveSkillPath(f.root, path), undefined, String(path));
  }
  await symlink(join(outside, "SKILL.md"), join(f.root, "linked-skill.md"), "file");
  await symlink(outside, join(f.root, "linked-directory"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(resolveSkillPath(f.root, "linked-skill.md"), /패키지 밖/);
  await assert.rejects(resolveSkillPath(f.root, "linked-directory/SKILL.md"), /패키지 밖/);
  assert.equal(
    await resolveSkillPath(f.root, "vendor/minimal-code/../minimal-code/SKILL.md"),
    await realpath(join(f.root, f.catalog.skills[0].path)),
    "A normalized path that remains inside the package is valid.",
  );
});

test("a catalog entry cannot bypass the path boundary through the one-shot command", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.temporary, "outside.md"), "OUTSIDE-CONTENT-SENTINEL");
  f.catalog.skills[0].path = "../outside.md";
  await writeFile(join(f.root, "catalog.json"), JSON.stringify(f.catalog));
  const h = harness(f.root);
  await h.command("skill minimal-code");
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
  assert.equal(h.notifications.at(-1).level, "error");
  assert.doesNotMatch(JSON.stringify(h.notifications), /OUTSIDE-CONTENT-SENTINEL/);
});

test("profile hooks return only an additive message for Pi strings and OMP array prompts", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root, [state("coding")]);
  for (const systemPrompt of [
    "Existing Pi system instructions.",
    [{ type: "text", text: "Existing OMP system block." }, { type: "text", text: "Second block." }],
  ]) {
    const event = { systemPrompt, prompt: "Implement the requested change." };
    const before = structuredClone(event);
    const result = await h.beforeStart(event);
    assert.deepEqual(Object.keys(result), ["message"]);
    assert.deepEqual(event, before, "The caller's system prompt must remain untouched.");
    assert.equal(result.message.customType, "pi-workbench.profile");
    assert.equal(result.message.display, false);
    assert.match(result.message.content, /Use existing project conventions/);
    assert.ok(result.message.content.includes(JSON.stringify(await realpath(join(f.root, f.catalog.skills[0].path)))));
    assert.match(result.message.content, /Read only the relevant SKILL\.md files/);
    assert.doesNotMatch(result.message.content, /RAW-CODING-BODY|RAW-REVIEW-BODY|game-art/);
  }
  assert.deepEqual(h.messages, [], "The hook result is returned to the host, not sent twice.");
  assert.deepEqual(h.appends, []);
});

test("auto and off require no catalog and inject no profile message", async (t) => {
  const temporary = await temporaryDirectory(t);
  const h = harness(join(temporary, "missing-catalog"));
  for (const mode of ["auto", "off"]) {
    await h.command("use " + mode);
    assert.equal(await h.beforeStart({ systemPrompt: [] }), undefined);
    await h.command("status");
    assert.equal(h.messages.at(-1).message.content, "Workbench profile: " + mode);
  }
  assert.deepEqual(h.notifications, []);
  assert.ok(h.messages.every(({ message }) => message.customType === "pi-workbench.output"));
});

test("an unusable catalog reports the profile error without damaging the host start event", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, "catalog.json"), JSON.stringify({ schemaVersion: 999, profiles: [], skills: [] }));
  const h = harness(f.root, [state("coding")]);
  const event = { systemPrompt: "Original system instructions." };
  assert.equal(await h.beforeStart(event), undefined);
  assert.deepEqual(event, { systemPrompt: "Original system instructions." });
  assert.equal(h.notifications.at(-1).level, "error");
  assert.match(h.notifications.at(-1).message, /catalog\.json/);
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
});

test("doctor checks presence without running binaries, contacting services, or exposing credentials", async (t) => {
  const temporary = await temporaryDirectory(t);
  const bin = join(temporary, "bin");
  const marker = join(temporary, "must-not-execute");
  await mkdir(bin);
  const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
  const executable = "#!/bin/sh\nprintf executed > " + quote(marker) + "\nexit 73\n";
  for (const command of ["git", "node", "ffmpeg"]) {
    await writeFile(join(bin, command), executable);
    await chmod(join(bin, command), 0o755);
  }
  await mkdir(join(bin, "blender"));
  await writeFile(join(bin, "python3"), "A regular non-executable file.\n");
  await chmod(join(bin, "python3"), 0o644);
  const env = Object.freeze({
    PATH: bin,
    OPENAI_API_KEY: "DO-NOT-LEAK-OPENAI-SENTINEL",
    ELEVENLABS_API_KEY: "DO-NOT-LEAK-ELEVENLABS-SENTINEL",
    SCENARIO_API_KEY: " \t\n ",
    CONTEXT7_API_KEY: undefined,
    LAYER_API_KEY: 0,
  });
  const envBefore = { ...env };
  let networkCalls = 0;
  if (typeof globalThis.fetch === "function") {
    t.mock.method(globalThis, "fetch", () => {
      networkCalls++;
      throw new Error("doctor must not contact external services");
    });
  }
  const result = await doctor({ env, platform: process.platform });
  const found = new Map(result.executables.map(({ name, present }) => [name, present]));
  assert.equal(found.get("git"), true);
  assert.equal(found.get("node"), true);
  assert.equal(found.get("ffmpeg"), true);
  assert.equal(found.get("blender"), false, "An executable directory is not a binary.");
  assert.equal(found.get("rg"), false);
  if (process.platform !== "win32") assert.equal(found.get("python3"), false);
  assert.deepEqual(result.environment, [
    { name: "OPENAI_API_KEY", present: true },
    { name: "ELEVENLABS_API_KEY", present: true },
    { name: "SCENARIO_API_KEY", present: false },
    { name: "CONTEXT7_API_KEY", present: false },
    { name: "LAYER_API_KEY", present: false },
  ]);
  assert.doesNotMatch(JSON.stringify(result), /DO-NOT-LEAK|SENTINEL/);
  assert.deepEqual(env, envBefore);
  assert.equal(networkCalls, 0);
  await assert.rejects(readFile(marker), { code: "ENOENT" });
  await assert.rejects(probeExecutable("node --version", { env }), /실행파일 이름/);
  await assert.rejects(probeExecutable("../node", { env }), /실행파일 이름/);
});
