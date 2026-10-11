import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  BUSY_SKILL_MESSAGE,
  OUTPUT_TYPE,
  PROFILE_TYPE,
  SELECTED_SKILL_TYPE,
  STATE_TYPE,
  completeWorkbenchArguments,
  doctor,
  readCatalog,
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

const user = (text, timestamp = 1) => ({ role: "user", content: [{ type: "text", text }], timestamp });
const assistant = (text) => ({ role: "assistant", content: [{ type: "text", text }], timestamp: 2 });
const custom = (customType, content) => ({ role: "custom", customType, content, display: false, timestamp: 3 });
const profiles = (messages) => messages.filter((m) => m.role === "custom" && m.customType === PROFILE_TYPE);

/**
 * @param {string} root
 * @param {any[]} [initialBranch]
 * @param {{ idle?: () => boolean }} [options]
 */
function harness(root, initialBranch = [], { idle = () => true } = {}) {
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
    isIdle: () => idle(),
  };
  registerWorkbench(pi, root);
  return {
    commands, hooks, messages, appends, notifications,
    outputs: () => notifications.filter(({ level }) => level === "info").map(({ message }) => message),
    errors: () => notifications.filter(({ level }) => level === "error").map(({ message }) => message),
    switchBranch(entries) { branch = entries; },
    command(args) { return commands.get("workbench").handler(args, ctx); },
    complete(prefix) { return commands.get("workbench").getArgumentCompletions(prefix); },
    context(list = []) { return hooks.get("context")({ type: "context", messages: list }, ctx); },
    /** The conversation the model receives for one request (the context hook's projection). */
    async request(list = []) { return (await this.context(list))?.messages ?? list; },
    beforeStart(event = {}) { return hooks.get("before_agent_start")(event, ctx); },
  };
}

test("registration has no startup messages, state writes, or dependency work", async (t) => {
  const temporary = await temporaryDirectory(t);
  const h = harness(join(temporary, "package-not-installed"));
  assert.deepEqual([...h.commands.keys()], ["workbench"]);
  assert.deepEqual([...h.hooks.keys()], ["context", "before_agent_start"]);
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
  assert.deepEqual(h.notifications, []);
  assert.equal(await h.context([user("hello")]), undefined);
  assert.equal(await h.beforeStart({ systemPrompt: "Existing instructions", systemPromptOptions: { sections: {} } }), undefined);
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
  const only = async () => {
    const list = profiles(await h.request([user("request")]));
    assert.equal(list.length, 1);
    return list[0].content;
  };
  assert.match(await only(), /\(coding\)/);
  h.switchBranch(sibling);
  assert.match(await only(), /\(game\)/);
  await h.command("use off");
  assert.equal(await h.context([user("request")]), undefined);
  h.switchBranch(main);
  assert.match(await only(), /\(coding\)/);
  await h.command("status");
  assert.equal(h.outputs().at(-1), "Workbench profile: coding");
  assert.deepEqual(main, mainBefore, "Selecting a profile in a sibling must not rewrite its parent.");
  assert.equal(sibling.at(-1).data.mode, "off");
  assert.deepEqual(h.errors(), []);
  assert.deepEqual(h.messages, [], "Profile guidance and command output are never stored as messages.");
});

test("repeated requests carry exactly one current profile guidance and never store it", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root, [state("coding")]);
  const skill = { ...custom(SELECTED_SKILL_TYPE, "ONE-SHOT-SKILL"), display: true };
  // History of an older version: stored profile guidance and command output, next to other extensions' messages.
  const history = [
    custom(PROFILE_TYPE, "Selected workbench profile: OLD (game)."),
    user("first"), assistant("first answer"),
    custom(OUTPUT_TYPE, "Workbench profile: game"),
    custom("another-extension", "KEEP-OTHER"),
    skill,
    custom(PROFILE_TYPE, "Selected workbench profile: OLD AGAIN (game)."),
  ];
  for (let index = 0; index < 3; index++) {
    history.push(user(`request ${index}`));
    const before = structuredClone(history);
    const sent = await h.request(history);
    assert.deepEqual(history, before, "The stored conversation is not modified.");
    const list = profiles(sent);
    assert.equal(list.length, 1, `request ${index}`);
    assert.equal(sent[0], list[0], "The guidance comes first, at a stable place.");
    assert.match(list[0].content, /\(coding\)/);
    assert.match(list[0].content, /replaces any earlier Workbench profile guidance/);
    assert.equal(list[0].display, false);
    assert.doesNotMatch(JSON.stringify(sent), /OLD|pi-workbench\.output/);
    assert.ok(sent.some((m) => m.content === "KEEP-OTHER"));
    assert.ok(sent.includes(skill) || sent.some((m) => m.customType === SELECTED_SKILL_TYPE && m.content === "ONE-SHOT-SKILL"));
    assert.equal(sent.length, history.length - 3 + 1);
    history.push(assistant(`answer ${index}`));
  }
  await h.command("use game");
  const game = await h.request(history);
  assert.equal(profiles(game).length, 1);
  assert.match(profiles(game)[0].content, /\(game\)/);
  assert.doesNotMatch(JSON.stringify(game), /\(coding\)/);
  for (const mode of ["auto", "off"]) {
    await h.command(`use ${mode}`);
    const sent = await h.request(history);
    assert.equal(profiles(sent).length, 0, mode);
    assert.doesNotMatch(JSON.stringify(sent), /OLD|pi-workbench\.output/);
  }
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.errors(), []);
});

test("list, filtered list, status and help are shown to the user without entering the model context", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root);
  await h.command("list");
  assert.match(h.outputs().at(-1), /minimal-code/);
  assert.match(h.outputs().at(-1), /review/);
  assert.match(h.outputs().at(-1), /game-art/);
  await h.command("list game");
  assert.match(h.outputs().at(-1), /game-art/);
  assert.doesNotMatch(h.outputs().at(-1), /minimal-code|RAW-GAME-BODY/);
  await h.command("use coding");
  assert.deepEqual(h.appends, [{ customType: STATE_TYPE, data: { mode: "coding" } }]);
  await h.command("status");
  assert.equal(h.outputs().at(-1), "Workbench profile: coding");
  await h.command("");
  assert.match(h.outputs().at(-1), /\/workbench skill <id>/);
  assert.deepEqual(h.messages, [], "Command output is not sent to or stored for the model.");
  assert.deepEqual(h.errors(), []);
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

test("an idle skill selection queues for the next request without changing profile state", async (t) => {
  const f = await fixture(t);
  const entries = [state("game")];
  const h = harness(f.root, entries);
  await h.command("skill minimal-code");
  assert.equal(h.messages.length, 1);
  const { message, options } = h.messages[0];
  assert.equal(message.customType, SELECTED_SKILL_TYPE);
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
  const subsequent = profiles(await h.request([user("request")]));
  assert.equal(subsequent.length, 1);
  assert.match(subsequent[0].content, /\(game\)/);
  assert.doesNotMatch(subsequent[0].content, /RAW-CODING-BODY|selected-skill/);
});

test("a skill selection while the agent is busy is refused, also when the agent starts during loading", async (t) => {
  const f = await fixture(t);
  for (const states of [[false], [true, false]]) {
    const sequence = [...states];
    const h = harness(f.root, [state("game")], { idle: () => Boolean(sequence.length > 1 ? sequence.shift() : sequence[0]) });
    await h.command("skill minimal-code");
    assert.deepEqual(h.messages, [], `nothing may be queued (${states})`);
    assert.deepEqual(h.appends, []);
    assert.equal(h.notifications.at(-1).level, "error");
    assert.equal(h.notifications.at(-1).message, `Workbench: ${BUSY_SKILL_MESSAGE}`);
  }
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
  assert.match(profiles(await h.request([user("request")]))[0].content, /\(coding\)/);
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

test("Pi prompt options get no stored message; hosts without them (OMP strings and arrays) keep the additive fallback", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root, [state("coding")]);
  const pi = { systemPrompt: "Existing Pi system instructions.", systemPromptOptions: { sections: { other: "kept" } }, prompt: "Implement." };
  const piBefore = structuredClone(pi);
  assert.equal(await h.beforeStart(pi), undefined);
  assert.deepEqual(pi, piBefore, "Pi's prompt options stay untouched.");
  for (const systemPrompt of [
    "Existing OMP-like system instructions.",
    [{ type: "text", text: "Existing OMP system block." }, { type: "text", text: "Second block." }],
  ]) {
    const event = { systemPrompt, prompt: "Implement the requested change." };
    const before = structuredClone(event);
    const result = await h.beforeStart(event);
    assert.deepEqual(Object.keys(result), ["message"]);
    assert.deepEqual(event, before, "The caller's system prompt must remain untouched.");
    assert.equal(result.message.customType, PROFILE_TYPE);
    assert.equal(result.message.display, false);
    assert.match(result.message.content, /Use existing project conventions/);
    assert.ok(result.message.content.includes(JSON.stringify(await realpath(join(f.root, f.catalog.skills[0].path)))));
    assert.match(result.message.content, /Read only the relevant SKILL\.md files/);
    assert.doesNotMatch(result.message.content, /RAW-CODING-BODY|RAW-REVIEW-BODY|game-art/);
    // A host that also has the context event still sends only one guidance.
    const sent = await h.request([{ role: "custom", ...result.message, timestamp: 1 }, user("request")]);
    assert.equal(profiles(sent).length, 1);
  }
  assert.deepEqual(h.messages, [], "The hook result is returned to the host, not sent twice.");
  assert.deepEqual(h.appends, []);
});

test("auto and off require no catalog and add no profile guidance", async (t) => {
  const temporary = await temporaryDirectory(t);
  const h = harness(join(temporary, "missing-catalog"));
  for (const mode of ["auto", "off"]) {
    await h.command("use " + mode);
    assert.equal(await h.context([user("request")]), undefined);
    assert.equal(await h.beforeStart({ systemPrompt: [] }), undefined);
    await h.command("status");
    assert.equal(h.outputs().at(-1), "Workbench profile: " + mode);
  }
  assert.deepEqual(h.errors(), []);
  assert.deepEqual(h.messages, []);
});

test("an unusable catalog reports the profile error once without damaging the request", async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, "catalog.json"), JSON.stringify({ schemaVersion: 999, profiles: [], skills: [] }));
  const h = harness(f.root, [state("coding")]);
  const list = [custom(PROFILE_TYPE, "stale guidance"), user("request")];
  for (let index = 0; index < 2; index++) {
    const sent = await h.request(list);
    assert.deepEqual(sent, [user("request")], "Stale guidance is dropped and nothing new is added.");
  }
  const event = { systemPrompt: "Original system instructions." };
  assert.equal(await h.beforeStart(event), undefined);
  assert.deepEqual(event, { systemPrompt: "Original system instructions." });
  assert.equal(h.errors().length, 1, "Reported once, not on every request.");
  assert.match(h.errors()[0], /catalog\.json/);
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

const values = (items) => items?.map((item) => item.value) ?? null;

test("argument completion follows the command grammar: subcommands, then catalog profiles or skill ids", async (t) => {
  const { catalog } = await fixture(t);
  const complete = (prefix) => values(completeWorkbenchArguments(prefix, catalog));
  const subcommands = ["list", "use ", "skill ", "status", "doctor", "help"];
  assert.deepEqual(complete(""), subcommands);
  assert.deepEqual(complete("   "), subcommands, "Leading whitespace is ignored.");
  assert.deepEqual(complete("u"), ["use "]);
  assert.deepEqual(complete("s"), ["skill ", "status"]);
  assert.deepEqual(complete("use "), ["use coding", "use game", "use auto", "use off"]);
  assert.deepEqual(complete("use c"), ["use coding"]);
  assert.deepEqual(complete("  use \t c"), ["use coding"], "Repeated whitespace still finds the argument.");
  assert.deepEqual(complete("use a"), ["use auto"]);
  assert.deepEqual(complete("list "), ["list coding", "list game"], "list offers catalog profiles, not auto/off.");
  assert.deepEqual(complete("list g"), ["list game"]);
  assert.deepEqual(complete("skill "), ["skill minimal-code", "skill review", "skill game-art"]);
  assert.deepEqual(complete("skill r"), ["skill review"]);
  const [skill] = completeWorkbenchArguments("skill mi", catalog);
  assert.deepEqual(skill, {
    value: "skill minimal-code",
    label: "skill minimal-code",
    description: "Minimal Code: Inspect existing callers before changing code.",
  });
  for (const finished of [
    "status", "doctor", "help", "list", "use coding", "skill review", // complete as typed: Enter submits
    "use coding ", "use coding x", "skill review ", "list game more", // a finished argument or an extra word
    "status ", "doctor x", "help ", // subcommands without arguments
    "list coding ", "use off ", "\tuse\tcoding\t", "skill review extra", // whitespace or a third token after the argument
    "skill coding", "list auto", "list off", "use minimal-code", // values of another subcommand
    "bogus", "bogus ", "use zz", "skill nope", "USE ", "use Coding", // unknown words; the handler is case-sensitive
  ]) {
    assert.equal(completeWorkbenchArguments(finished, catalog), null, JSON.stringify(finished));
  }
  assert.deepEqual(complete("u"), ["use "], "Subcommands need no catalog.");
  assert.deepEqual(values(completeWorkbenchArguments("use ", undefined)), ["use auto", "use off"], "auto/off need no catalog.");
  for (const prefix of ["list ", "skill ", "use c"]) {
    assert.equal(completeWorkbenchArguments(prefix, undefined), null, `Without a catalog no ${JSON.stringify(prefix)} argument is invented.`);
  }
  assert.deepEqual(values(completeWorkbenchArguments("", undefined)), subcommands);
});

test("every completed argument is accepted by the command handler", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root);
  for (const command of ["list", "use", "skill"]) {
    for (const value of values(await h.complete(command + " "))) {
      await h.command(value);
      assert.deepEqual(h.errors(), [], value);
    }
  }
  assert.equal(h.messages.length, 3, "Each completed skill id selects that skill.");
});

test("completion reads only the catalog and changes no command or session state", async (t) => {
  const f = await fixture(t);
  // Skill bodies are unreadable: completion must not open them.
  for (const skill of f.catalog.skills) await rm(join(f.root, skill.path));
  const h = harness(f.root, [state("game")]);
  assert.deepEqual(values(await h.complete("skill ")), ["skill minimal-code", "skill review", "skill game-art"]);
  assert.deepEqual(values(await h.complete("use g")), ["use game"]);
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
  assert.deepEqual(h.notifications, []);
});

test("a missing catalog leaves subcommands, offers no arguments, reports nothing and is retried", async (t) => {
  const f = await fixture(t);
  const text = await readFile(join(f.root, "catalog.json"), "utf8");
  await rm(join(f.root, "catalog.json"));
  const h = harness(f.root);
  assert.deepEqual(values(await h.complete("l")), ["list"]);
  assert.equal(await h.complete("skill "), null);
  assert.equal(await h.complete("list "), null);
  assert.deepEqual(values(await h.complete("use ")), ["use auto", "use off"], "auto/off stay usable without a catalog.");
  await writeFile(join(f.root, "catalog.json"), "{ broken");
  assert.equal(await h.complete("skill "), null, "A broken catalog does not throw.");
  assert.deepEqual(h.notifications, [], "Typing must not raise errors.");
  await writeFile(join(f.root, "catalog.json"), text);
  assert.deepEqual(values(await h.complete("use g")), ["use game"], "A failed read is not cached.");
});

test("the shipped catalog supplies every profile and skill id as a candidate", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const catalog = await readCatalog(root);
  assert.deepEqual(values(completeWorkbenchArguments("list ", catalog)), catalog.profiles.map((profile) => `list ${profile.id}`));
  assert.deepEqual(values(completeWorkbenchArguments("use ", catalog)), [...catalog.profiles.map((profile) => `use ${profile.id}`), "use auto", "use off"]);
  assert.deepEqual(values(completeWorkbenchArguments("skill ", catalog)), catalog.skills.map((skill) => `skill ${skill.id}`));
  assert.deepEqual(values(completeWorkbenchArguments("skill ponytail", catalog)), ["skill ponytail", "skill ponytail-review"],
    "An id that prefixes another stays offered next to it.");
  assert.equal(completeWorkbenchArguments("skill ponytail-review", catalog), null);
  assert.equal(catalog.skills.length, 27);
  assert.equal(catalog.profiles.length, 7);
});
