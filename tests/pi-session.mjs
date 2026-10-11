// Optional real-host session check: Pi AgentSessions with this package loaded and a scripted (faux) model. It checks what the model
// receives per request: one current profile guidance across requests, branches, auto/off and reload; command output kept out of the
// context as session records that survive reopening the session file; one-shot skill selections attached to exactly the next user
// request (also a follow-up or steering message typed while another extension's run works), once per skill, cancelable, dropped
// by /reload or a branch change, and cancelled (not moved on) when the next request is a queued /skill: command or prompt template.
// No network or paid model is used.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { OUTPUT_ENTRY_TYPE, SELECTED_SKILL_TYPE, SKILL_MARKER, displayWidth } from "../lib/runtime.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hostPath = process.env.PI_WORKBENCH_HOST_MODULE ? resolve(process.env.PI_WORKBENCH_HOST_MODULE) : undefined;
const host = await import(hostPath ? pathToFileURL(hostPath).href : "@earendil-works/pi-coding-agent");
// pi-ai (faux provider) and pi-tui next to the host package: its own node_modules or the sibling install.
const sibling = (name, envName) => {
  const candidates = hostPath ? [
    join(dirname(hostPath), "..", "node_modules", "@earendil-works", name, "dist", "index.js"),
    join(dirname(hostPath), "..", "..", name, "dist", "index.js"),
  ] : [];
  const found = process.env[envName] ? resolve(process.env[envName]) : candidates.find((path) => existsSync(path));
  return found ? pathToFileURL(found).href : `@earendil-works/${name}`;
};
const ai = await import(sibling("pi-ai", "PI_WORKBENCH_AI_MODULE"));
const tui = await import(sibling("pi-tui", "PI_WORKBENCH_TUI_MODULE"));

const PROFILE = "Selected workbench profile:";
const count = (text, needle) => text.split(needle).length - 1;
const textOf = (message) => (typeof message.content === "string" ? message.content
  : (message.content ?? []).filter((part) => part.type === "text").map((part) => part.text).join(""));
const sandbox = await mkdtemp(join(tmpdir(), "pi-workbench-session-"));
const sessions = [];
let made = 0;

/**
 * A Pi session with this package and a probe extension; every model request is recorded, and one can be held open.
 * @param {{ mode?: string, sessionDir?: string, extension?: (pi: any) => void, templates?: Record<string, string> }} [options]
 */
async function makeSession({ mode = "tui", sessionDir, extension, templates } = {}) {
  made++;
  const cwd = join(sandbox, `project-${made}`);
  const agentDir = join(sandbox, `agent-${made}`);
  await mkdir(cwd);
  await mkdir(agentDir);
  if (templates) {
    // Prompt templates of the user (Pi reads <agentDir>/prompts/*.md).
    await mkdir(join(agentDir, "prompts"));
    for (const [name, content] of Object.entries(templates)) await writeFile(join(agentDir, "prompts", `${name}.md`), content);
  }
  const probe = {};
  const settingsManager = host.SettingsManager.inMemory({ packages: [root], compaction: { enabled: false } });
  const resourceLoader = new host.DefaultResourceLoader({
    cwd, agentDir, settingsManager, noPromptTemplates: !templates, noThemes: true, noContextFiles: true,
    extensionFactories: [(pi) => { probe.api = pi; extension?.(pi); }],
  });
  await resourceLoader.reload();
  const faux = ai.fauxProvider({ provider: `workbench-faux-${made}` });
  const requests = [];
  let hold;
  const respond = async (context) => {
    requests.push(context.messages);
    const current = hold;
    hold = undefined;
    if (current) { current.started(); await current.released; }
    return ai.fauxAssistantMessage(`answer ${requests.length}`);
  };
  faux.setResponses(Array.from({ length: 40 }, () => respond));
  const runtime = await host.ModelRuntime.create({ credentials: new ai.InMemoryCredentialStore(), modelsPath: null, refreshOnCreate: false });
  runtime.registerNativeProvider(faux.provider);
  const model = runtime.getModel(faux.provider.id, faux.getModel().id);
  const sessionManager = sessionDir ? host.SessionManager.create(cwd, sessionDir) : host.SessionManager.inMemory(cwd);
  const { session } = await host.createAgentSession({ cwd, agentDir, modelRuntime: runtime, model, thinkingLevel: "off", resourceLoader, settingsManager, sessionManager });
  sessions.push(session);
  const notes = [];
  await session.bindExtensions({ uiContext: { notify: (message, type) => notes.push({ message, type }) }, mode });
  return {
    session, requests, notes, probe,
    /** The next model request waits until `release()`; `started` resolves once it was received. */
    hold() {
      const gate = {};
      gate.startedPromise = new Promise((resolveStarted) => { gate.started = resolveStarted; });
      gate.released = new Promise((resolveReleased) => { gate.release = resolveReleased; });
      hold = gate;
      return { started: gate.startedPromise, release: () => gate.release() };
    },
    infos: () => notes.filter((note) => note.type === "info").map((note) => note.message),
    warnings: () => notes.filter((note) => note.type === "warning").map((note) => note.message),
  };
}

/** The user message of a request carrying `needle`, parsed the way Pi's transcript parses `/skill:name request` messages. */
function userMessage(request, needle) {
  const message = request.find((item) => item.role === "user" && textOf(item).includes(needle));
  assert.ok(message, `a user message with ${needle}`);
  return { text: textOf(message), block: host.parseSkillBlock(textOf(message)) };
}
const all = (request) => request.map(textOf).join("\n");

try {
  // 1. Profile guidance: one current copy per request across requests, a branch switch, a reload and auto/off; records kept out.
  {
    const s = await makeSession();
    const { session, requests } = s;
    await session.prompt("/workbench use coding");
    for (const text of ["one", "two", "three"]) await session.prompt(text);
    for (const sent of requests.slice(0, 3)) {
      assert.equal(count(all(sent), PROFILE), 1, "exactly one profile guidance per request");
      assert.match(all(sent), /\(coding\)/);
    }
    const codingLeaf = session.sessionManager.getLeafId();
    await session.prompt("/workbench use game");
    await session.prompt("four");
    assert.equal(count(all(requests[3]), PROFILE), 1);
    assert.match(all(requests[3]), /\(game\)/);
    assert.doesNotMatch(all(requests[3]), /\(coding\)/);
    await session.navigateTree(codingLeaf, { summarize: false });
    await session.prompt("five");
    assert.match(all(requests[4]), /\(coding\)/, "The branch's own profile is restored after switching branches.");
    await session.reload();
    await session.prompt("six");
    assert.equal(count(all(requests[5]), PROFILE), 1);
    assert.match(all(requests[5]), /\(coding\)/, "The profile survives a reload.");
    await session.prompt("/workbench use off");
    await session.prompt("seven");
    assert.equal(count(all(requests.at(-1)), PROFILE), 0, "off adds no guidance");
    const stored = session.sessionManager.getEntries().filter((entry) => entry.type === "custom_message" && String(entry.customType).startsWith("pi-workbench."));
    assert.deepEqual(stored, [], "No Workbench message is stored in the session.");
  }

  // 2. The reviewed defect: an idle selection, then another extension's run (a task result: triggerTurn + followUp; a woken peer
  // note: triggerTurn + steer) and the user's follow-up or steering message typed during it. The selection goes with that message,
  // not with the extension's run and not with a later unrelated request.
  for (const [wake, typed] of [[{ triggerTurn: true, deliverAs: "followUp" }, "followUp"], [{ triggerTurn: true, deliverAs: "steer" }, "steer"]]) {
    const s = await makeSession();
    await s.session.prompt("/workbench skill ponytail-review");
    const held = s.hold();
    s.probe.api.sendMessage({ customType: "probe.extension-message", content: "EXTENSION-MESSAGE arrived", display: true }, wake);
    await held.started;
    await s.session.prompt("MY-REQUEST", { streamingBehavior: typed });
    held.release();
    await s.session.waitForIdle();
    await s.session.prompt("LATER-UNRELATED");
    const [triggered, answered, later] = s.requests;
    assert.equal(s.requests.length, 3, `${typed}: the extension's run, the user's message in that run, the later request`);
    assert.match(all(triggered), /EXTENSION-MESSAGE/);
    assert.equal(count(all(triggered), SKILL_MARKER), 0, `${typed}: the extension's message does not take the selection`);
    const mine = userMessage(answered, "MY-REQUEST");
    assert.equal(mine.block?.name, "ponytail-review", `${typed}: the selection is in the user's own message`);
    assert.equal(mine.block.userMessage, "MY-REQUEST");
    assert.ok(mine.block.content.startsWith(SKILL_MARKER));
    assert.match(mine.block.content, /the user request that follows this block in the same message/);
    assert.equal(count(all(answered), SKILL_MARKER), 1);
    const last = userMessage(later, "LATER-UNRELATED");
    assert.equal(last.text, "LATER-UNRELATED", `${typed}: the later request is untouched`);
    assert.equal(count(all(later), SKILL_MARKER), 1, `${typed}: only the history keeps the one copy`);
    assert.ok(s.infos().some((message) => message.includes(`ponytail-review 스킬을 이 사용자 요청 (${typed === "steer" ? "steering" : "follow-up"})에 붙였습니다`)));
  }

  // 3. Once per skill, cancel one or all, and status.
  {
    const s = await makeSession({ mode: "print" });
    await s.session.prompt("/workbench skill ponytail");
    await s.session.prompt("/workbench skill ponytail");
    await s.session.prompt("/workbench skill find-docs");
    await s.session.prompt("/workbench skill search-first");
    await s.session.prompt("/workbench cancel find-docs");
    await s.session.prompt("/workbench status");
    assert.match(s.infos().at(-1), /대기 중인 스킬 선택 \(다음 사용자 요청 한 번\): ponytail, search-first/);
    await s.session.prompt("implement it");
    const mine = userMessage(s.requests[0], "implement it");
    assert.equal(mine.block.name, "ponytail, search-first");
    assert.equal(count(all(s.requests[0]), "--- BEGIN ORIGINAL SKILL.md ---"), 2, "ponytail once, search-first once, find-docs not at all");
    assert.doesNotMatch(all(s.requests[0]), /\(find-docs\)/);
    await s.session.prompt("/workbench skill ponytail");
    await s.session.prompt("/workbench cancel");
    await s.session.prompt("next request");
    assert.equal(userMessage(s.requests[1], "next request").text, "next request", "a cancelled selection reaches no request");
  }

  // 4. Lifecycle: /reload and a branch change drop a pending selection with a notice; a cancelled branch change keeps it.
  {
    let cancelTree = false;
    const s = await makeSession({ extension: (pi) => pi.on("session_before_tree", () => (cancelTree ? { cancel: true } : undefined)) });
    await s.session.prompt("first");
    const firstLeaf = s.session.sessionManager.getLeafId();
    await s.session.prompt("/workbench skill ponytail");
    await s.session.reload();
    assert.ok(s.warnings().some((message) => /대기 중이던 스킬 선택을 취소했습니다 \(\/reload\): ponytail/.test(message)));
    await s.session.prompt("after reload");
    assert.equal(userMessage(s.requests.at(-1), "after reload").text, "after reload");
    await s.session.prompt("/workbench skill ponytail");
    await s.session.navigateTree(firstLeaf, { summarize: false });
    assert.ok(s.warnings().some((message) => /분기를 옮겨 대기 중이던 스킬 선택을 취소했습니다: ponytail/.test(message)));
    await s.session.prompt("on the other branch");
    assert.equal(userMessage(s.requests.at(-1), "on the other branch").text, "on the other branch");
    await s.session.prompt("/workbench skill ponytail");
    cancelTree = true;
    const result = await s.session.navigateTree(firstLeaf, { summarize: false });
    assert.equal(result.cancelled, true);
    await s.session.prompt("same branch");
    assert.equal(userMessage(s.requests.at(-1), "same branch").block?.name, "ponytail", "a cancelled navigation keeps the selection");
  }

  // 5. A /skill: command stays Pi's to expand; the selection follows that request as one message.
  {
    const s = await makeSession();
    await s.session.prompt("/workbench skill ponytail-review");
    await s.session.prompt("/skill:wb-coding 이 변경을 리뷰해줘");
    const request = s.requests[0];
    const routed = userMessage(request, "이 변경을 리뷰해줘");
    assert.equal(routed.block?.name, "wb-coding", "Pi still expanded its own skill command");
    assert.equal(routed.block.userMessage, "이 변경을 리뷰해줘");
    const index = request.findIndex((message) => textOf(message).startsWith(SKILL_MARKER));
    assert.ok(index > request.indexOf(request.find((message) => textOf(message).includes("이 변경을 리뷰해줘"))), "after the request");
    assert.match(textOf(request[index]), /the user request immediately before this message/);
    const stored = s.session.sessionManager.getEntries().filter((entry) => entry.type === "custom_message" && entry.customType === SELECTED_SKILL_TYPE);
    assert.equal(stored.length, 1);
    const view = s.session.extensionRunner.getMessageRenderer(SELECTED_SKILL_TYPE);
    const collapsed = new tui.Container();
    collapsed.addChild(view({ ...stored[0], role: "custom" }, { expanded: false, outputPad: 1 }, { fg: (_t, x) => x, bg: (_t, x) => x }));
    assert.match(collapsed.render(60).join("\n"), /\[skill\] ponytail-review \(Workbench one-shot\)/);
    await s.session.prompt("later");
    assert.equal(count(all(s.requests[1]), SKILL_MARKER), 1, "kept in history, not added again");
  }

  // 5b. A /skill: command or a prompt template (with $@) queued while another extension's run works: Pi expands and queues it at
  // once, so the selection cannot go with it. It is cancelled with a notice; the queued request reaches the model as Pi expanded it;
  // no later request gets the selection.
  /** @type {[string, string, (text: string) => boolean][]} */
  const queuedCases = [
    ["/skill:wb-coding QUEUED-REQUEST", "followUp", (text) => host.parseSkillBlock(text)?.name === "wb-coding"],
    ["/review-files a.ts QUEUED-REQUEST", "steer", (text) => text.trim() === "Review these files carefully: a.ts QUEUED-REQUEST"],
    ["/review-files b.ts QUEUED-REQUEST", "followUp", (text) => text.trim() === "Review these files carefully: b.ts QUEUED-REQUEST"],
  ];
  for (const [queuedText, typed, expanded] of queuedCases) {
    const s = await makeSession({ templates: { "review-files": "---\ndescription: Review the given files\n---\nReview these files carefully: $@\n" } });
    await s.session.prompt("/workbench skill ponytail-review");
    const held = s.hold();
    s.probe.api.sendMessage({ customType: "probe.extension-message", content: "EXTENSION-MESSAGE arrived", display: true }, { triggerTurn: true, deliverAs: "followUp" });
    await held.started;
    await s.session.prompt(queuedText, { streamingBehavior: typed });
    held.release();
    await s.session.waitForIdle();
    await s.session.prompt("LATER-UNRELATED");
    assert.ok(s.warnings().some((message) => /\/skill:·프롬프트 템플릿 요청에는 Workbench 스킬을 붙일 수 없어 선택\(ponytail-review\)을 취소했습니다/.test(message)), queuedText);
    const queuedRequest = s.requests.find((request) => request.some((message) => textOf(message).includes("QUEUED-REQUEST")));
    assert.ok(expanded(userMessage(queuedRequest, "QUEUED-REQUEST").text), `${queuedText} (${typed}): Pi expanded the queued request itself`);
    assert.equal(count(all(s.requests.at(-1)), SKILL_MARKER), 0, `${queuedText}: neither the queued request nor a later one carries the selection`);
    assert.equal(userMessage(s.requests.at(-1), "LATER-UNRELATED").text, "LATER-UNRELATED");
    await s.session.prompt("/workbench status");
    assert.match(s.session.sessionManager.getEntries().filter((entry) => entry.customType === OUTPUT_ENTRY_TYPE).at(-1).data.text, /대기 중인 스킬 선택: 없음/);
  }

  // 6. Command output: session records the TUI renders, never in a model request, still there when the session file is reopened.
  {
    const sessionDir = join(sandbox, "sessions");
    const s = await makeSession({ sessionDir });
    await s.session.prompt("hello");
    await s.session.prompt("/workbench list");
    await s.session.prompt("/workbench status");
    await s.session.prompt("/workbench skill ponytail");
    await s.session.prompt("/workbench status");
    assert.deepEqual(s.infos().filter((message) => /Profiles:|Workbench profile:/.test(message)), [], "In the TUI the record is the output, not a notice.");
    await s.session.prompt("after records");
    const records = s.session.sessionManager.getEntries().filter((entry) => entry.type === "custom" && entry.customType === OUTPUT_ENTRY_TYPE);
    assert.deepEqual(records.map((entry) => entry.data.command), ["list", "status", "status"]);
    assert.match(records[2].data.text, /대기 중인 스킬 선택 \(다음 사용자 요청 한 번\): ponytail/);
    const lastRequest = all(s.requests.at(-1));
    assert.doesNotMatch(lastRequest, /Profiles: requirements|Workbench profile: auto|대기 중인 스킬 선택/, "No record reaches the model.");
    const render = s.session.extensionRunner.getEntryRenderer(OUTPUT_ENTRY_TYPE);
    const view = new tui.Container();
    view.addChild(render(records[0], { expanded: false }, { fg: (_t, x) => x, bg: (_t, x) => x }));
    for (const width of [30, 100]) {
      const lines = view.render(width);
      assert.ok(lines.length > 27 && lines.every((line) => tui.visibleWidth(line) <= width && displayWidth(line) <= width), `rendered within ${width}`);
    }
    const file = s.session.sessionManager.getSessionFile();
    s.session.dispose();
    const reopened = host.SessionManager.open(file);
    const shown = reopened.buildContextEntries().filter((entry) => entry.type === "custom" && entry.customType === OUTPUT_ENTRY_TYPE);
    assert.deepEqual(shown.map((entry) => entry.data.command), ["list", "status", "status"], "The reopened transcript has the records.");
    assert.doesNotMatch(JSON.stringify(reopened.buildSessionContext().messages), /Profiles: requirements|Workbench profile: auto/, "The reopened model context has none.");
    // Pi writes a session file only once it has a conversation: a session with only commands leaves no file behind.
    const empty = await makeSession({ sessionDir: join(sandbox, "sessions-empty") });
    await empty.session.prompt("/workbench list");
    const emptyFile = empty.session.sessionManager.getSessionFile();
    empty.session.dispose();
    assert.equal(existsSync(emptyFile), false, "documented limit: no conversation, no file");
  }

  console.log(JSON.stringify({
    ok: true,
    hostModule: hostPath ?? "@earendil-works/pi-coding-agent",
    sessions: made,
    profileGuidancePerRequest: 1,
    extensionRunsTakeSelection: false,
    selectionGoesWithTypedFollowUpAndSteer: true,
    reloadAndBranchChangeDropSelection: true,
    queuedSkillCommandAndTemplateCancelSelection: true,
    outputRecordsReopened: true,
  }, null, 2));
} finally {
  for (const session of sessions) {
    try { session.dispose(); } catch { /* already disposed */ }
  }
  await rm(sandbox, { recursive: true, force: true });
}
