import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  OUTPUT_ENTRY_TYPE,
  OUTPUT_TYPE,
  PROFILE_TYPE,
  SELECTED_SKILL_TYPE,
  SKILL_MARKER,
  STATE_TYPE,
  completeWorkbenchArguments,
  displayWidth,
  doctor,
  embedSkillSelections,
  readCatalog,
  probeExecutable,
  readSkill,
  registerWorkbench,
  renderOutputEntry,
  renderSelectedSkillMessage,
  resolveSkillPath,
  skillSelectionText,
  workbenchAutocompleteProvider,
} from "../lib/runtime.js";

// Pi 1.1.0's parser of a `/skill:name request` user message (agent-session.js parseSkillBlock), which its transcript uses.
const PI_SKILL_BLOCK = /^<skill name="([^"]+)" location="([^"]+)">\n([\s\S]*?)\n<\/skill>(?:\n\n([\s\S]+))?$/;

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
const count = (text, needle) => text.split(needle).length - 1;
const plainTheme = { fg: (_token, text) => text, bg: (_token, text) => text };
// eslint-disable-next-line no-control-regex
const plain = (lines) => lines.map((line) => line.replace(/\x1b\[[0-9;]*m/g, ""));

/**
 * @param {string} root
 * @param {any[]} [initialBranch]
 * @param {{ mode?: string, commands?: any[] | (() => any[]), renderers?: boolean, dependencies?: any }} [options]
 */
function harness(root, initialBranch = [], { mode, commands: slashCommands = [], renderers = true, dependencies = { env: { PATH: "" } } } = {}) {
  let branch = initialBranch;
  const commands = new Map();
  const hooks = new Map();
  const messages = [];
  const appends = [];
  const notifications = [];
  const entryRenderers = new Map();
  const messageRenderers = new Map();
  const autocompleteFactories = [];
  const statuses = [];
  const listeners = new Map();
  const events = {
    on(channel, handler) {
      if (!listeners.has(channel)) listeners.set(channel, []);
      listeners.get(channel).push(handler);
      return () => listeners.set(channel, listeners.get(channel).filter((item) => item !== handler));
    },
    emit(channel, data) { for (const handler of listeners.get(channel) ?? []) handler(data); },
  };
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
    getCommands: () => (typeof slashCommands === "function" ? slashCommands() : slashCommands),
    events,
    ...(renderers ? {
      registerEntryRenderer(customType, renderer) { entryRenderers.set(customType, renderer); },
      registerMessageRenderer(customType, renderer) { messageRenderers.set(customType, renderer); },
    } : {}),
  };
  const ctx = {
    mode,
    sessionManager: { getBranch: () => branch },
    ui: {
      notify: (message, level) => notifications.push({ message, level }),
      addAutocompleteProvider: (factory) => autocompleteFactories.push(factory),
      setStatus: (key, text) => statuses.push([key, text]),
    },
  };
  registerWorkbench(pi, root, { dependencies });
  return {
    commands, hooks, messages, appends, notifications, entryRenderers, messageRenderers, autocompleteFactories, events, listeners, statuses,
    outputs: () => notifications.filter(({ level }) => level === "info").map(({ message }) => message),
    warnings: () => notifications.filter(({ level }) => level === "warning").map(({ message }) => message),
    errors: () => notifications.filter(({ level }) => level === "error").map(({ message }) => message),
    records: () => appends.filter(({ customType }) => customType === OUTPUT_ENTRY_TYPE).map(({ data }) => data),
    states: () => appends.filter(({ customType }) => customType === STATE_TYPE),
    switchBranch(entries) { branch = entries; },
    command(args) { return commands.get("workbench").handler(args, ctx); },
    complete(prefix) { return commands.get("workbench").getArgumentCompletions(prefix); },
    context(list = []) { return hooks.get("context")({ type: "context", messages: list }, ctx); },
    /** The conversation the model receives for one request (the context hook's projection). */
    async request(list = []) { return (await this.context(list))?.messages ?? list; },
    beforeStart(event = {}) { return hooks.get("before_agent_start")(event, ctx); },
    /** A user input as Pi's input event carries it (idle unless `streamingBehavior` is set). */
    input(text, event = {}) { return hooks.get("input")({ type: "input", text, source: "interactive", ...event }, ctx); },
    start() { return hooks.get("session_start")({ type: "session_start", reason: "startup" }, ctx); },
    tree() { return hooks.get("session_tree")({ type: "session_tree", newLeafId: "b", oldLeafId: "a" }, ctx); },
    shutdown(reason) { return hooks.get("session_shutdown")({ type: "session_shutdown", reason }, ctx); },
  };
}

test("registration has no startup messages, state writes, or dependency work", async (t) => {
  const temporary = await temporaryDirectory(t);
  const h = harness(join(temporary, "package-not-installed"));
  assert.deepEqual([...h.commands.keys()], ["workbench"]);
  assert.deepEqual([...h.hooks.keys()], ["input", "context", "before_agent_start", "session_start", "session_tree", "session_shutdown"]);
  assert.deepEqual([...h.entryRenderers.keys()], [OUTPUT_ENTRY_TYPE]);
  assert.deepEqual([...h.messageRenderers.keys()], [SELECTED_SKILL_TYPE]);
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
  assert.deepEqual(h.notifications, []);
  assert.equal(await h.context([user("hello")]), undefined);
  assert.equal(h.input("hello"), undefined, "Without a selection the input passes unchanged.");
  assert.equal(await h.beforeStart({ systemPrompt: "Existing instructions", systemPromptOptions: { sections: {} } }), undefined);
  assert.equal(await h.beforeStart({ systemPrompt: "Existing instructions" }), undefined);
  h.tree();
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
  assert.match(h.outputs().at(-1), /^Workbench profile: coding$/m);
  assert.deepEqual(main.filter((entry) => entry.customType !== OUTPUT_ENTRY_TYPE), mainBefore, "Selecting a profile in a sibling must not rewrite its parent.");
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

test("list, filtered list, status, doctor and help become session records that never enter the model context", async (t) => {
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
  assert.deepEqual(h.states(), [{ customType: STATE_TYPE, data: { mode: "coding" } }]);
  await h.command("status");
  assert.match(h.outputs().at(-1), /^Workbench profile: coding$/m);
  assert.match(h.outputs().at(-1), /대기 중인 스킬 선택: 없음/);
  await h.command("");
  assert.match(h.outputs().at(-1), /\/workbench skill <id>/);
  assert.match(h.outputs().at(-1), /\/workbench cancel \[id\]/);
  await h.command("doctor");
  await h.command("install-deps");
  assert.deepEqual(h.records().map(({ command }) => command), ["list", "list game", "status", "help", "doctor", "install-deps"],
    "Each long output is a session entry; the profile confirmation is a notice only.");
  assert.deepEqual(h.records().map(({ text }) => text), [0, 1, 3, 4, 5, 6].map((index) => h.notifications[index].message),
    "Outside the TUI (here: no mode) the record is also shown as a notification.");
  assert.deepEqual(h.notifications.slice(5).map(({ level }) => level), ["warning", "warning"],
    "With nothing on PATH the dependency reports are warnings (optional tools only), at the report's level.");
  assert.match(h.records()[4].text, /^pi-workbench doctor: warning$/m);
  assert.match(h.records()[5].text, /^pi-workbench install-deps: manual action required$/m);
  assert.deepEqual(h.messages, [], "Command output is not sent to or stored for the model.");
  // Session entries are not messages: the model's context (here, the context hook's projection) never carries them.
  assert.doesNotMatch(JSON.stringify(await h.request([user("request")])), /Profiles: coding|Workbench profile: coding|대기 중인 스킬 선택|pi-workbench doctor|pi-workbench install-deps|\/workbench cancel/);
  assert.deepEqual(h.errors(), []);
});

test("in the interactive TUI the records are rendered in the transcript instead of a notice that a later one replaces", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root, [state("coding")], { mode: "tui" });
  for (const command of ["list", "list coding", "status", "help", "doctor"]) await h.command(command);
  assert.deepEqual(h.outputs(), [], "No info notice: the transcript entry is the output.");
  assert.equal(h.records().length, 5);
  const render = h.entryRenderers.get(OUTPUT_ENTRY_TYPE);
  const entry = { type: "custom", customType: OUTPUT_ENTRY_TYPE, data: h.records()[0] };
  for (const width of [8, 20, 37, 80, 160]) {
    const lines = render(entry, { expanded: false }, plainTheme).render(width);
    assert.ok(lines.every((line) => displayWidth(line) <= width), `every line fits width ${width}`);
    const text = plain(lines).join("\n").replace(/\s+/g, "");
    assert.ok(text.startsWith("[workbenchlist]Profiles:coding,game"), `header and first line at width ${width}`);
    for (const skill of f.catalog.skills) assert.ok(text.includes(skill.id), `${skill.id} at width ${width}`);
  }
  assert.match(plain(render(entry, { expanded: false }, plainTheme).render(80)).join("\n"), /^ \[workbench list\] *$/m);
  // A record without its data renders nothing rather than failing the transcript.
  assert.equal(render({ type: "custom", customType: OUTPUT_ENTRY_TYPE }, { expanded: false }, plainTheme), undefined);
  // Without entry renderers (another host) the notice is still the output; the record is kept for the session.
  const other = harness(f.root, [state("coding")], { mode: "tui", renderers: false });
  await other.command("status");
  assert.match(other.outputs().at(-1), /Workbench profile: coding/);
  assert.equal(other.records().length, 1);
});

test("the renderers wrap wide text conservatively and keep Pi's transcript colors", () => {
  assert.equal(displayWidth("abc"), 3);
  assert.equal(displayWidth("가나"), 4);
  assert.equal(displayWidth("— · →"), 5);
  assert.equal(displayWidth("😀"), 2);
  const colored = { fg: (token, text) => `<${token}>${text}</${token}>`, bg: (token, text) => `[${token}]${text}` };
  const korean = "기능·비기능 요구사항과 수용 기준을 도출하는 아주 긴 설명 문장이 여러 줄로 나뉘어야 합니다";
  const lines = renderOutputEntry({ data: { command: "list", text: korean } }, {}, plainTheme).render(24);
  assert.ok(lines.length > 3);
  assert.ok(lines.every((line) => displayWidth(line) <= 24));
  assert.equal(plain(lines).join("").replace(/\s+/g, ""), `[workbenchlist]${korean.replace(/\s+/g, "")}`);
  const styled = renderOutputEntry({ data: { command: "status", text: "Workbench profile: coding" } }, {}, colored).render(40);
  assert.ok(styled.every((line) => line.startsWith("[customMessageBg]")));
  assert.ok(styled.some((line) => line.includes("<customMessageLabel>")));
  assert.ok(styled.some((line) => line.includes("<customMessageText>Workbench profile: coding</customMessageText>")));
  const message = { role: "custom", customType: SELECTED_SKILL_TYPE, content: "FULL-SKILL-TEXT", display: true, details: { skillIds: ["review"] } };
  const collapsed = renderSelectedSkillMessage(message, { expanded: false }, plainTheme).render(60).join("\n");
  assert.match(collapsed, /\[skill\] review \(Workbench one-shot\)/);
  assert.doesNotMatch(collapsed, /FULL-SKILL-TEXT/);
  assert.match(renderSelectedSkillMessage(message, { expanded: true }, plainTheme).render(60).join("\n"), /FULL-SKILL-TEXT/);
  // Messages an older version stored carry one skill id.
  assert.match(renderSelectedSkillMessage({ ...message, details: { skillId: "old-id" } }, {}, plainTheme).render(60).join("\n"), /old-id/);
});

test("one-shot text keeps the exact raw instructions, the canonical base directory and a scope tied to its placement", async (t) => {
  const f = await fixture(t);
  const selection = await readSkill(f.root, f.catalog.skills[0]);
  assert.equal(selection.raw, f.raw["minimal-code"]);
  assert.equal(selection.path, await realpath(join(f.root, f.catalog.skills[0].path)));
  assert.equal(selection.baseDir, dirname(selection.path));
  const content = skillSelectionText([selection], f.root);
  const startMarker = "--- BEGIN BUNDLED SKILL.md ---\n";
  const endMarker = "\n--- END BUNDLED SKILL.md ---";
  const start = content.indexOf(startMarker) + startMarker.length;
  const end = content.lastIndexOf(endMarker);
  assert.ok(start >= startMarker.length && end > start);
  assert.equal(content.slice(start, end), f.raw["minimal-code"], "Do not normalize or rewrite upstream content.");
  assert.ok(content.startsWith(`${SKILL_MARKER} Minimal Code (minimal-code).`));
  assert.match(content, /for the user request that follows this block in the same message/);
  assert.match(content, /Apply it to that request and the work it starts only/);
  assert.match(content, /does not apply to later user requests, even though this text stays in the conversation history/);
  assert.doesNotMatch(content, /next user request/, "The text sits with the request it applies to: no 'next request' that reads as a later one.");
  assert.match(content, /does not change the Workbench profile/);
  assert.match(content, /whole session do not apply to this one-shot selection/);
  // Provenance without claiming that every bundled file is the unmodified upstream original.
  assert.doesNotMatch(content, /ORIGINAL SKILL\.md/);
  const provenance = `Bundled skill files are based on locked upstream commits and may include reviewed corrections; a file noted "Modified by pi-workbench" carries them, listed in ${JSON.stringify(join(f.root, "THIRD_PARTY_NOTICES.md"))}.`;
  assert.ok(content.includes(provenance));
  // The same block and wording for a corrected file, whose text is also passed on byte for byte.
  const corrected = { ...selection, raw: "---\nname: corrected\n---\n<!-- Modified by pi-workbench: example. -->\nBody\r\n  trailing  \n" };
  const correctedContent = skillSelectionText([corrected], f.root);
  assert.ok(correctedContent.includes(`${startMarker}${corrected.raw}${endMarker}`));
  assert.ok(correctedContent.includes(provenance));
  const baseLine = content.split("\n").find((line) => line.startsWith("Base directory: "));
  const baseDir = JSON.parse(baseLine.slice("Base directory: ".length));
  assert.equal(await readFile(join(baseDir, "references/checklist.md"), "utf8"), "Reference resolved from the skill directory.\n");
  assert.match(content, /Do not add host-specific hooks/);
  assert.match(content, /Optional documentation provider/);
  assert.match(content, /not installed or connected by this extension/);
  const after = skillSelectionText([selection], f.root, "after");
  assert.match(after, /for the user request immediately before this message/);
  // In front of the request, in Pi's own one-shot skill format: Pi's transcript shows a collapsed skill block and the request.
  const embedded = embedSkillSelections([selection], f.root, "이 변경을 구현해줘");
  const [, name, location, body, request] = PI_SKILL_BLOCK.exec(embedded);
  assert.equal(name, "minimal-code");
  assert.equal(location, selection.path);
  assert.equal(body, content);
  assert.equal(request, "이 변경을 구현해줘");
  assert.ok(PI_SKILL_BLOCK.test(embedSkillSelections([selection], f.root, "")), "An image-only request keeps a parseable block.");
});

test("an idle selection goes to the next user request only, in front of it, without changing profile state", async (t) => {
  const f = await fixture(t);
  const entries = [state("game")];
  const h = harness(f.root, entries);
  await h.command("skill minimal-code");
  assert.deepEqual(h.messages, [], "Nothing is queued in Pi: Workbench keeps the selection itself.");
  assert.deepEqual(h.appends, []);
  assert.match(h.outputs().at(-1), /minimal-code 원본 스킬을 다음 사용자 요청 한 번에 붙입니다/);
  await h.command("status");
  assert.match(h.outputs().at(-1), /대기 중인 스킬 선택 \(다음 사용자 요청 한 번\): minimal-code/);
  const images = [{ type: "image", data: "AAAA", mimeType: "image/png" }];
  const result = h.input("이 변경을 구현해줘", { images });
  assert.equal(result.action, "transform");
  assert.equal(result.images, undefined, "Images stay as they are (Pi keeps the current ones).");
  const [, name, , body, request] = PI_SKILL_BLOCK.exec(result.text);
  assert.equal(name, "minimal-code");
  assert.equal(request, "이 변경을 구현해줘");
  assert.ok(body.includes(f.raw["minimal-code"]));
  assert.match(h.outputs().at(-1), /minimal-code 스킬을 이 사용자 요청에 붙였습니다/);
  // Taken: the following requests are not touched again.
  assert.equal(h.input("다음 요청"), undefined);
  assert.equal(h.input("그 다음 요청", { streamingBehavior: "followUp" }), undefined);
  await h.command("status");
  assert.match(h.outputs().at(-1), /대기 중인 스킬 선택: 없음/);
  const subsequent = profiles(await h.request([user("request")]));
  assert.equal(subsequent.length, 1);
  assert.match(subsequent[0].content, /\(game\)/);
  assert.doesNotMatch(subsequent[0].content, /RAW-CODING-BODY|selected-skill/);
  assert.deepEqual(entries.filter((entry) => entry.customType === STATE_TYPE), [state("game")]);
  assert.deepEqual(h.errors(), []);
});

test("a steering or follow-up message typed while another run works receives the selection", async (t) => {
  const f = await fixture(t);
  for (const streamingBehavior of ["steer", "followUp"]) {
    const h = harness(f.root);
    await h.command("skill review");
    // An extension's own message (task result, peer note) starts a run without Pi's input event: nothing here is called.
    const result = h.input("이 결과를 반영해줘", { streamingBehavior });
    assert.equal(result.action, "transform", streamingBehavior);
    assert.equal(PI_SKILL_BLOCK.exec(result.text)[4], "이 결과를 반영해줘");
    assert.match(h.outputs().at(-1), streamingBehavior === "steer" ? /\(steering\)에 붙였습니다/ : /\(follow-up\)에 붙였습니다/);
    assert.equal(h.input("나중의 무관한 요청"), undefined, `${streamingBehavior}: not attached again later`);
  }
  // Selecting while the agent works is allowed now: the typed steering message right after takes it.
  const busy = harness(f.root);
  await busy.command("skill review");
  assert.equal(busy.input("steer now", { streamingBehavior: "steer" }).action, "transform");
  // A user message an extension submits on the user's behalf (/orche single, a held follow-up, a queued prompt) also takes it.
  const relayed = harness(f.root);
  await relayed.command("skill review");
  assert.equal(relayed.input("relayed request", { source: "extension" }).action, "transform");
  assert.match(relayed.outputs().at(-1), /확장이 사용자 대신 보낸 요청/);
});

test("selections are kept once per skill, several skills share one block, and cancel removes one or all", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root);
  await h.command("skill minimal-code");
  await h.command("skill minimal-code");
  assert.match(h.outputs().at(-1), /minimal-code은\(는\) 이미 다음 사용자 요청에 붙을 예정입니다/);
  await h.command("skill review");
  await h.command("skill game-art");
  await h.command("status");
  assert.match(h.outputs().at(-1), /: minimal-code, review, game-art —/);
  await h.command("cancel review");
  assert.match(h.outputs().at(-1), /review 선택을 취소했습니다\. 남은 선택: minimal-code, game-art/);
  await h.command("cancel review");
  assert.match(h.errors().at(-1), /대기 중인 스킬 선택이 아닙니다: review/);
  const text = h.input("request").text;
  const [, name, , body] = PI_SKILL_BLOCK.exec(text);
  assert.equal(name, "minimal-code, game-art");
  assert.equal(count(text, f.raw["minimal-code"]), 1, "One copy of a skill selected twice.");
  assert.equal(count(text, "RAW-GAME-BODY"), 1);
  assert.equal(count(text, "RAW-REVIEW-BODY"), 0, "A cancelled skill is not sent.");
  assert.equal(count(text, SKILL_MARKER), 1);
  assert.match(body, /these skills .* Apply them to that request and the work it starts only/s);
  assert.ok(body.indexOf("## Minimal Code (minimal-code)") < body.indexOf("## Game Art (game-art)"), "Selection order is kept.");
  await h.command("skill review");
  await h.command("cancel");
  assert.match(h.outputs().at(-1), /대기 중이던 스킬 선택을 취소했습니다: review/);
  assert.equal(h.input("after cancel"), undefined);
  await h.command("cancel");
  assert.match(h.outputs().at(-1), /대기 중인 스킬 선택이 없습니다/);
  assert.deepEqual(h.messages, []);
});

test("a branch change, reload or session switch drops pending selections with a notice; none moves to another request", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root);
  await h.command("skill review");
  h.tree();
  assert.match(h.warnings().at(-1), /분기를 옮겨 대기 중이던 스킬 선택을 취소했습니다: review/);
  assert.equal(h.input("request on the other branch"), undefined);
  for (const [reason, label] of [["reload", "/reload"], ["new", "새 세션"], ["resume", "세션 전환"], ["fork", "세션 fork"]]) {
    const other = harness(f.root);
    await other.command("skill review");
    other.shutdown(reason);
    assert.match(other.warnings().at(-1), new RegExp(`대기 중이던 스킬 선택을 취소했습니다 \\(${label}\\): review`));
    assert.equal(other.input("request"), undefined, reason);
  }
  const quitting = harness(f.root);
  await quitting.command("skill review");
  quitting.shutdown("quit");
  assert.deepEqual(quitting.warnings(), [], "Quitting needs no notice.");
  // Nothing pending: a branch change says nothing.
  const quiet = harness(f.root);
  quiet.tree();
  assert.deepEqual(quiet.notifications, []);
});

test("a selection still loading when it is cancelled, the branch changes or the runtime stops is not added afterwards", async (t) => {
  const f = await fixture(t);
  for (const interrupt of ["cancel", "cancel minimal-code", "tree", "reload"]) {
    const h = harness(f.root);
    const loading = h.command("skill minimal-code");
    await h.command("status");
    assert.match(h.outputs().at(-1), /: minimal-code —/, `${interrupt}: a loading selection is listed`);
    if (interrupt === "tree") h.tree();
    else if (interrupt === "reload") h.shutdown("reload");
    else await h.command(interrupt);
    await loading;
    assert.equal(h.input("request"), undefined, `${interrupt}: no selection revived by the finished read`);
    if (interrupt !== "reload") assert.match(h.warnings().at(-1), /불러오는 동안 선택이 취소되어 붙이지 않습니다/);
  }
  // Two selections of the same skill at once: one is kept.
  const twice = harness(f.root);
  await Promise.all([twice.command("skill review"), twice.command("skill review")]);
  assert.equal(count(twice.input("request").text, "RAW-REVIEW-BODY"), 1);
  // A request that arrives while the SKILL.md is still read waits for the read and takes the selection, not a later request.
  const racing = harness(f.root);
  const selecting = racing.command("skill review");
  const taken = await racing.input("request typed right away");
  await selecting;
  assert.equal(taken.action, "transform");
  assert.equal(PI_SKILL_BLOCK.exec(taken.text)[4], "request typed right away");
  assert.equal(racing.input("later"), undefined);
});

test("requests Pi expands itself keep their command at the start: idle ones get the selection after them, queued ones cancel it", async (t) => {
  const f = await fixture(t);
  const slash = [{ name: "skill:wb-coding", source: "skill" }, { name: "review-template", source: "prompt" }, { name: "workbench", source: "extension" }];
  for (const text of ["/skill:wb-coding 이 변경을 리뷰해줘", "/review-template src/app.ts"]) {
    const h = harness(f.root, [], { commands: slash });
    await h.command("skill review");
    assert.equal(h.input(text), undefined, `${text}: unchanged, so Pi still expands it`);
    const started = await h.beforeStart({ prompt: "expanded", systemPromptOptions: { sections: {} } });
    assert.equal(started.message.customType, SELECTED_SKILL_TYPE);
    assert.equal(started.message.display, true);
    assert.deepEqual(started.message.details, { skillIds: ["review"], placement: "after" });
    assert.match(started.message.content, /for the user request immediately before this message/);
    assert.ok(started.message.content.includes(f.raw.review));
    assert.match(h.outputs().at(-1), /review 스킬을 이 사용자 요청 바로 뒤에 붙였습니다/);
    assert.equal(await h.beforeStart({ prompt: "later", systemPromptOptions: { sections: {} } }), undefined, "only once");
    assert.equal(h.input("later request"), undefined);
  }
  // Queued while the agent works: Pi expands and queues it right after the input event, so the selection cannot go with it. It is
  // cancelled with a notice and never moves on to a later request.
  const queued = harness(f.root, [], { commands: slash });
  await queued.command("skill review");
  await queued.command("skill game-art");
  assert.equal(queued.input("/review-template x", { streamingBehavior: "followUp" }), undefined, "the queued request is unchanged");
  assert.match(queued.warnings().at(-1), /\/skill:·프롬프트 템플릿 요청에는 Workbench 스킬을 붙일 수 없어 선택\(review, game-art\)을 취소했습니다\. 이후 요청으로 넘기지 않습니다/);
  assert.match(queued.warnings().at(-1), /\/workbench skill <id>로 다시 선택/);
  assert.equal(queued.input("plain follow-up", { streamingBehavior: "followUp" }), undefined, "not attached to the next request");
  assert.equal(queued.input("/skill:wb-coding later", { streamingBehavior: "steer" }), undefined);
  await queued.command("status");
  assert.match(queued.outputs().at(-1), /대기 중인 스킬 선택: 없음/);
  await queued.command("skill review");
  assert.equal(queued.input("selected again, in plain words", { streamingBehavior: "steer" }).action, "transform");
  // An idle request that took them but never started (for example no model) does not pass them on to the next input either.
  const unstarted = harness(f.root, [], { commands: slash });
  await unstarted.command("skill review");
  assert.equal(unstarted.input("/review-template x"), undefined);
  assert.equal(unstarted.input("retry in plain words"), undefined);
  assert.match(unstarted.warnings().at(-1), /스킬\(review\)을 받을 요청이 시작되지 않아 선택을 취소했습니다/);
  assert.equal(await unstarted.beforeStart({ prompt: "retry", systemPromptOptions: { sections: {} } }), undefined, "not sent later");
  // Slash text Pi does not expand is an ordinary request; on a host that cannot list commands any slash text is treated as expandable.
  const literal = harness(f.root, [], { commands: slash });
  await literal.command("skill review");
  assert.equal(literal.input("/usr/bin is missing").action, "transform");
  const unknownHost = harness(f.root, [], { commands: () => { throw new Error("no commands"); } });
  await unknownHost.command("skill review");
  assert.equal(unknownHost.input("/anything"), undefined);
});

test("a run another extension's message starts (Pi 1.2.0+: before_agent_start with messageType custom) takes no selection", async (t) => {
  const f = await fixture(t);
  const slash = [{ name: "skill:wb-coding", source: "skill" }, { name: "review-template", source: "prompt" }, { name: "workbench", source: "extension" }];
  const custom = (extra = {}) => ({ messageType: "custom", message: { role: "custom", customType: "peer-note", content: "note", display: true }, systemPromptOptions: { sections: {} }, ...extra });
  const userRun = (prompt) => ({ messageType: "user", prompt, systemPromptOptions: { sections: {} } });
  // An idle /skill: or template request took the selection but never started (no model, its input handled elsewhere); a custom
  // message then starts a run: the selection is cancelled there with the notice, not attached, and not passed on.
  for (const text of ["/skill:wb-coding 이 변경을 리뷰해줘", "/review-template src/app.ts"]) {
    const h = harness(f.root, [], { commands: slash });
    await h.command("skill review");
    assert.equal(h.input(text), undefined);
    assert.equal(await h.beforeStart(custom()), undefined, `${text}: the extension's run gets nothing`);
    assert.match(h.warnings().at(-1), /스킬\(review\)을 받을 요청이 시작되지 않아 선택을 취소했습니다/);
    assert.ok(!h.outputs().some((message) => /바로 뒤에 붙였습니다/.test(message)), `${text}: no "attached" notice`);
    const warnings = h.warnings().length;
    assert.equal(await h.beforeStart(custom()), undefined, `${text}: a second custom-started run gets nothing either`);
    assert.equal(h.input("next request"), undefined, `${text}: not passed on to the next input`);
    assert.equal(await h.beforeStart(userRun("next request")), undefined, `${text}: nor to its run`);
    assert.equal(h.warnings().length, warnings, `${text}: cancelled once`);
    // Selected again: it goes with the next user request as usual, once.
    await h.command("skill review");
    const again = h.input("selected again");
    assert.equal(PI_SKILL_BLOCK.exec(again.text)[1], "review");
    assert.equal(h.input("later"), undefined);
  }
  // Selections no user request has taken yet stay for the next one, through any number of custom-started runs.
  const waiting = harness(f.root, [], { commands: slash });
  await waiting.command("skill review");
  assert.equal(await waiting.beforeStart(custom()), undefined);
  assert.equal(await waiting.beforeStart(custom()), undefined);
  assert.deepEqual(waiting.warnings(), []);
  await waiting.command("status");
  assert.match(waiting.outputs().at(-1), /대기 중인 스킬 선택 \(다음 사용자 요청 한 번\): review/);
  const taken = waiting.input("user request");
  assert.equal(PI_SKILL_BLOCK.exec(taken.text)[4], "user request");
  assert.equal(waiting.input("later"), undefined, "once");
  // A deferred selection and one made after it (pending) meet a custom-started run: only the deferred one is cancelled, with one
  // notice over repeated custom runs; the pending one goes with the next user request, once, and never with the extension's runs.
  const both = harness(f.root, [], { commands: slash });
  await both.command("skill review");
  assert.equal(both.input("/skill:wb-coding 이 변경을 리뷰해줘"), undefined);
  await both.command("skill game-art");
  assert.equal(await both.beforeStart(custom()), undefined, "the extension's run gets neither selection");
  assert.equal(await both.beforeStart(custom()), undefined, "nor a second one");
  assert.equal(both.warnings().length, 1, "one cancellation notice");
  assert.match(both.warnings()[0], /스킬\(review\)을 받을 요청이 시작되지 않아 선택을 취소했습니다/);
  assert.doesNotMatch(both.warnings()[0], /game-art/);
  const next = both.input("next request");
  assert.equal(PI_SKILL_BLOCK.exec(next.text)[1], "game-art", "the pending selection goes with the next user request");
  assert.equal(PI_SKILL_BLOCK.exec(next.text)[4], "next request");
  assert.doesNotMatch(next.text, /name="review"/, "the cancelled one does not");
  assert.equal(both.input("later"), undefined, "once");
  // An idle expanded request's own (user) run still gets the selection right after it, once; a custom run after it gets none.
  const expanded = harness(f.root, [], { commands: slash });
  await expanded.command("skill review");
  assert.equal(expanded.input("/review-template x"), undefined);
  const started = await expanded.beforeStart(userRun("Review x"));
  assert.deepEqual(started.message.details, { skillIds: ["review"], placement: "after" });
  assert.equal(await expanded.beforeStart(custom()), undefined);
  assert.deepEqual(expanded.warnings(), []);
  // A host without structured prompt options (OMP) keeps its additive profile message in a custom-started run, also when it
  // cancels an unstarted request's selection there.
  const omp = harness(f.root, [state("coding")], { commands: slash });
  await omp.command("skill review");
  assert.equal(omp.input("/review-template x"), undefined);
  const ompStart = await omp.beforeStart(custom({ systemPromptOptions: undefined, systemPrompt: "Existing instructions" }));
  assert.equal(ompStart.message.customType, PROFILE_TYPE);
  assert.match(omp.warnings().at(-1), /스킬\(review\)을 받을 요청이 시작되지 않아/);
});

test("invalid commands and missing catalog selections report errors without queueing or persisting work", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root, [state("coding")]);
  for (const command of [
    "not-a-command", "skill", "skill absent", "list absent", "cancel absent",
    "use", "use absent", "use vision", "use coding extra", "status extra", "cancel review extra",
  ]) {
    const count = h.notifications.length;
    await h.command(command);
    assert.equal(h.notifications.length, count + 1, command);
    assert.equal(h.notifications.at(-1).level, "error", command);
    assert.match(h.notifications.at(-1).message, /^Workbench:/);
  }
  assert.deepEqual(h.messages, []);
  assert.deepEqual(h.appends, []);
  assert.equal(h.input("request"), undefined);
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
  assert.equal(h.input("request"), undefined, "Nothing was selected.");
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
    assert.match(h.outputs().at(-1), new RegExp(`^Workbench profile: ${mode}$`, "m"));
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

test("argument completion follows the command grammar: subcommands, then catalog profiles, skill ids or pending selections", async (t) => {
  const { catalog } = await fixture(t);
  const complete = (prefix, pending) => values(completeWorkbenchArguments(prefix, catalog, pending));
  const subcommands = ["list", "use ", "skill ", "cancel", "status", "doctor", "install-deps", "help"];
  assert.deepEqual(complete(""), subcommands);
  assert.deepEqual(complete("   "), subcommands, "Leading whitespace is ignored.");
  assert.deepEqual(complete("u"), ["use "]);
  assert.deepEqual(complete("s"), ["skill ", "status"]);
  assert.deepEqual(complete("c"), ["cancel"]);
  assert.deepEqual(complete("d"), ["doctor"]);
  assert.deepEqual(complete("i"), ["install-deps"]);
  assert.deepEqual(complete("install"), ["install-deps"]);
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
  assert.equal(completeWorkbenchArguments("skill mi", catalog, ["minimal-code"])[0].description, "[대기 중] Minimal Code: Inspect existing callers before changing code.");
  assert.deepEqual(complete("cancel ", ["review", "game-art"]), ["cancel review", "cancel game-art"]);
  assert.deepEqual(complete("cancel g", ["review", "game-art"]), ["cancel game-art"]);
  assert.equal(completeWorkbenchArguments("cancel ", catalog, []), null, "Nothing pending, nothing to cancel.");
  for (const finished of [
    "status", "doctor", "install-deps", "help", "list", "cancel", "use coding", "skill review", // complete as typed: Enter submits
    "use coding ", "use coding x", "skill review ", "list game more", // a finished argument or an extra word
    "status ", "doctor x", "install-deps ", "install-deps x", "help ", // subcommands without arguments
    "list coding ", "use off ", "\tuse\tcoding\t", "skill review extra", // whitespace or a third token after the argument
    "skill coding", "list auto", "list off", "use minimal-code", "cancel review", // values of another subcommand or not pending
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
  assert.deepEqual(values(await h.complete("cancel ")), ["cancel minimal-code", "cancel review", "cancel game-art"], "Each completed skill id selected that skill.");
  for (const value of values(await h.complete("cancel "))) {
    await h.command(value);
    assert.deepEqual(h.errors(), [], value);
  }
  assert.equal(await h.complete("cancel "), null);
  assert.deepEqual(h.messages, []);
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

test("Tab with no list open completes /workbench arguments instead of files and leaves everything else to Pi", async (t) => {
  const f = await fixture(t);
  const calls = [];
  const current = {
    triggerCharacters: ["#"],
    async getSuggestions(lines, line, col, options) { calls.push(["get", lines[line].slice(0, col), Boolean(options.force)]); return { items: [{ value: "FILE", label: "FILE" }], prefix: "" }; },
    applyCompletion(lines, line, col, item, prefix) { calls.push(["apply", item.value, prefix]); return { lines, cursorLine: line, cursorCol: col }; },
    shouldTriggerFileCompletion(lines, line, col) { calls.push(["gate", lines[line].slice(0, col)]); return !lines[line].trim().startsWith("/") || lines[line].trim().includes(" "); },
  };
  const h = harness(f.root, [], { commands: [{ name: "workbench", source: "extension", sourceInfo: { path: join(f.root, "index.js") } }] });
  h.start();
  assert.equal(h.autocompleteFactories.length, 1);
  const provider = h.autocompleteFactories[0](current);
  assert.deepEqual(provider.triggerCharacters, ["#"]);
  const forced = (line) => provider.getSuggestions([line], 0, line.length, { signal: new AbortController().signal, force: true });
  const suggestion = async (line) => { const result = await forced(line); return result && { prefix: result.prefix, values: values(result.items) }; };
  // The file gate declines `/workbench ` (command and space); the wrapper opens it for that command only.
  assert.equal(provider.shouldTriggerFileCompletion(["/workbench "], 0, 11), true);
  assert.equal(provider.shouldTriggerFileCompletion(["/orche "], 0, 7), false, "other commands keep Pi's gate");
  assert.deepEqual(await suggestion("/workbench "), { prefix: "", values: ["list", "use ", "skill ", "cancel", "status", "doctor", "install-deps", "help"] });
  assert.deepEqual(await suggestion("/workbench use "), { prefix: "use ", values: ["use coding", "use game", "use auto", "use off"] });
  assert.deepEqual(await suggestion("/workbench list "), { prefix: "list ", values: ["list coding", "list game"] });
  assert.deepEqual(await suggestion("/workbench skill "), { prefix: "skill ", values: ["skill minimal-code", "skill review", "skill game-art"] });
  assert.deepEqual(await suggestion("  /workbench skill r"), { prefix: "skill r", values: ["skill review"] });
  for (const line of ["/workbench xyz ", "/workbench use coding ", "/workbench status "]) {
    assert.equal(await forced(line), null, `${line}: nothing, and no file list`);
  }
  await h.command("skill review");
  assert.deepEqual(await suggestion("/workbench cancel "), { prefix: "cancel ", values: ["cancel review"] });
  assert.ok(!calls.some(([kind]) => kind === "get"), "Workbench argument positions never reach the file completion.");
  // Everything else is Pi's: typed (natural) completion, other commands, plain text, other lines.
  const natural = await provider.getSuggestions(["/workbench u"], 0, 12, { signal: new AbortController().signal });
  assert.equal(natural.items[0].value, "FILE");
  for (const line of ["/orche ", "see ./sr", "/workbenchx y"]) assert.equal((await forced(line)).items[0].value, "FILE", line);
  assert.equal((await provider.getSuggestions(["text", "/workbench "], 1, 11, { signal: new AbortController().signal, force: true })).items[0].value, "FILE");
  provider.applyCompletion(["/workbench u"], 0, 12, { value: "use ", label: "use " }, "u");
  assert.deepEqual(calls.at(-1), ["apply", "use ", "u"]);
  // A renamed command (two extensions registered /workbench) completes under its own name only.
  const renamed = harness(f.root, [], { commands: [{ name: "workbench:2", source: "extension", sourceInfo: { path: join(f.root, "index.js") } }, { name: "workbench:1", source: "extension", sourceInfo: { path: "/elsewhere/index.js" } }] });
  renamed.start();
  const own = renamed.autocompleteFactories[0](current);
  assert.deepEqual(values((await own.getSuggestions(["/workbench:2 u"], 0, 14, { signal: new AbortController().signal, force: true })).items), ["use "]);
  assert.equal((await own.getSuggestions(["/workbench:1 u"], 0, 14, { signal: new AbortController().signal, force: true })).items[0].value, "FILE");
  // Hosts without autocomplete wrappers (print, JSON, RPC have no-ops; others may lack it) are left alone.
  assert.equal(workbenchAutocompleteProvider(current, "workbench", async () => null).triggerCharacters, current.triggerCharacters);
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

test("the umbrella's dependency request gets the provider synchronously; doctor and install-deps show its formatted report", async (t) => {
  const f = await fixture(t);
  const calls = [];
  const run = async (command, args) => { calls.push([command, ...args]); return { code: 0, stdout: "", stderr: "" }; };
  const h = harness(f.root, [], { dependencies: { env: { PATH: "" }, platform: "linux", run } });
  assert.deepEqual([...h.listeners.keys()], ["oh-my-pi-extensions:dependencies"], "The provider listens from load on.");
  const provided = [];
  h.events.emit("oh-my-pi-extensions:dependencies", { version: 1, provide: (provider) => provided.push(provider) });
  assert.equal(provided.length, 1, "Answered inside the handler, synchronously.");
  assert.deepEqual({ id: provided[0].id, label: provided[0].label, command: provided[0].command }, { id: "pi-workbench", label: "pi-workbench", command: "/workbench" });
  const report = await provided[0].check({});
  assert.equal(report.items[0].status, "ok");
  assert.match(report.items[0].detail, /^3 skills in 2 profiles$/);
  assert.deepEqual(calls, [], "check runs no process");

  await h.command("doctor");
  const doctorRecord = h.records().at(-1);
  assert.equal(doctorRecord.command, "doctor");
  assert.equal(h.notifications.at(-1).message, doctorRecord.text, "The record is also the notice outside the TUI.");
  assert.equal(h.notifications.at(-1).level, "warning");
  assert.match(doctorRecord.text, /^pi-workbench doctor: warning\n {2}Workbench itself needs only Pi/);
  assert.match(doctorRecord.text, /\[warn\] ast-grep \(optional\): not found on PATH.*\n {6}-> npm install -g @ast-grep\/cli/);

  await h.command("install-deps");
  const installRecord = h.records().at(-1);
  assert.equal(installRecord.command, "install-deps");
  assert.match(installRecord.text, /^pi-workbench install-deps: manual action required$/m);
  assert.match(installRecord.text, /\[manual\] ffmpeg \(optional\).*\n {6}-> sudo apt install ffmpeg/);
  assert.equal(h.notifications.at(-1).level, "warning");
  assert.deepEqual(h.statuses, [["pi-workbench", "Workbench: installing skill tools…"], ["pi-workbench", undefined]], "The progress line is cleared.");
  assert.deepEqual(calls, [], "No npm or pipx on PATH: nothing is run.");

  // The new words take no argument; the existing grammar is unchanged.
  await h.command("install-deps now");
  await h.command("doctor x");
  assert.equal(h.errors().length, 2);
  assert.ok(h.errors().every((message) => message.includes("/workbench install-deps")), "Help, which lists the new subcommand.");
  assert.equal(h.records().length, 2);
});

test("in the TUI the dependency reports are transcript records only, like the other long outputs", async (t) => {
  const f = await fixture(t);
  const h = harness(f.root, [], { mode: "tui" });
  await h.command("doctor");
  await h.command("install-deps");
  assert.deepEqual(h.records().map(({ command }) => command), ["doctor", "install-deps"]);
  assert.deepEqual(h.notifications, []);
});
