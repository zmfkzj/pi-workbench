// Optional real-host session check: a Pi AgentSession with this package loaded and a scripted (faux) model.
// It checks what the model receives per request: one current profile guidance across requests, branches, auto/off and reload,
// command output kept out of the context, and one-shot skill selection refused while busy. No network or paid model is used.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hostPath = process.env.PI_WORKBENCH_HOST_MODULE ? resolve(process.env.PI_WORKBENCH_HOST_MODULE) : undefined;
const host = await import(hostPath ? pathToFileURL(hostPath).href : "@earendil-works/pi-coding-agent");
// pi-ai (faux provider) next to the host package: its own node_modules or the sibling install.
const aiCandidates = hostPath ? [
  join(dirname(hostPath), "..", "node_modules", "@earendil-works", "pi-ai", "dist", "index.js"),
  join(dirname(hostPath), "..", "..", "pi-ai", "dist", "index.js"),
] : [];
const aiPath = process.env.PI_WORKBENCH_AI_MODULE ? resolve(process.env.PI_WORKBENCH_AI_MODULE) : aiCandidates.find((path) => existsSync(path));
const ai = await import(aiPath ? pathToFileURL(aiPath).href : "@earendil-works/pi-ai");

const PROFILE = "Selected workbench profile:";
const SKILL = "Selected skill:";
const count = (text, needle) => text.split(needle).length - 1;
const sandbox = await mkdtemp(join(tmpdir(), "pi-workbench-session-"));
let session;
try {
  const cwd = join(sandbox, "project");
  const agentDir = join(sandbox, "agent");
  await mkdir(cwd);
  await mkdir(agentDir);
  const settingsManager = host.SettingsManager.inMemory({ packages: [root], compaction: { enabled: false } });
  const resourceLoader = new host.DefaultResourceLoader({ cwd, agentDir, settingsManager, noPromptTemplates: true, noThemes: true, noContextFiles: true });
  await resourceLoader.reload();
  const faux = ai.fauxProvider({ provider: "workbench-faux" });
  const requests = [];
  /** @type {(value?: unknown) => void} */
  let release = () => {};
  const blocked = new Promise((resolveBlocked) => { release = resolveBlocked; });
  /** @type {(value?: unknown) => void} */
  let started = () => {};
  const running = new Promise((resolveRunning) => { started = resolveRunning; });
  const record = (answer) => (context) => { requests.push(JSON.stringify(context.messages)); return ai.fauxAssistantMessage(answer); };
  const waitThenAnswer = async (context) => { requests.push(JSON.stringify(context.messages)); started(); await blocked; return ai.fauxAssistantMessage("long answer"); };
  faux.setResponses([
    record("r1"), record("r2"), record("r3"), // coding x3
    record("r4"), // game on a sibling branch
    record("r5"), // back on the coding branch
    record("r6"), // after reload
    waitThenAnswer, record("steered"), // busy run, with a steering message
    record("r7"), // idle request after the refused busy selection
    record("r8"), // idle selection
    record("r9"), // off
  ]);
  const runtime = await host.ModelRuntime.create({ credentials: new ai.InMemoryCredentialStore(), modelsPath: null, refreshOnCreate: false });
  runtime.registerNativeProvider(faux.provider);
  const model = runtime.getModel(faux.provider.id, faux.getModel().id);
  ({ session } = await host.createAgentSession({ cwd, agentDir, modelRuntime: runtime, model, thinkingLevel: "off", resourceLoader, settingsManager, sessionManager: host.SessionManager.inMemory(cwd) }));
  const notes = [];
  await session.bindExtensions({ uiContext: { notify: (message, type) => notes.push({ message, type }) } });
  const stored = () => session.sessionManager.getEntries().filter((entry) => entry.type === "custom_message" && String(entry.customType).startsWith("pi-workbench.") && entry.customType !== "pi-workbench.selected-skill");

  await session.prompt("/workbench use coding");
  for (const text of ["one", "two", "three"]) await session.prompt(text);
  for (const sent of requests.slice(0, 3)) {
    assert.equal(count(sent, PROFILE), 1, "exactly one profile guidance per request");
    assert.match(sent, /\(coding\)/);
  }
  const codingLeaf = session.sessionManager.getLeafId();

  await session.prompt("/workbench use game");
  await session.prompt("four");
  assert.equal(count(requests[3], PROFILE), 1);
  assert.match(requests[3], /\(game\)/);
  assert.doesNotMatch(requests[3], /\(coding\)/);

  await session.navigateTree(codingLeaf, { summarize: false });
  await session.prompt("five");
  assert.equal(count(requests[4], PROFILE), 1);
  assert.match(requests[4], /\(coding\)/, "The branch's own profile is restored after switching branches.");

  await session.reload();
  await session.prompt("six");
  assert.equal(count(requests[5], PROFILE), 1);
  assert.match(requests[5], /\(coding\)/, "The profile survives a reload.");

  await session.prompt("/workbench status");
  await session.prompt("/workbench list coding");
  assert.ok(notes.some((note) => note.type === "info" && note.message === "Workbench profile: coding"));
  assert.deepEqual(stored(), [], "No profile guidance or command output is stored in the session.");

  // Busy: the selection is refused, and neither the steering message nor a later idle request receives it.
  const busy = session.prompt("long task");
  await running;
  await session.prompt("/workbench skill ponytail-review");
  assert.ok(notes.some((note) => note.type === "error" && note.message.includes("작업이 진행 중")), "busy selection is refused");
  await session.prompt("steer this", { streamingBehavior: "steer" });
  release();
  await busy;
  await session.prompt("seven");
  for (const sent of requests.slice(6)) assert.equal(count(sent, SKILL), 0, "a refused selection never reaches a request");

  await session.prompt("/workbench skill ponytail-review");
  await session.prompt("eight");
  const idleRequest = requests.at(-1);
  assert.equal(count(idleRequest, SKILL), 1, "an idle selection reaches the next request");
  assert.equal(count(idleRequest, PROFILE), 1);

  await session.prompt("/workbench use off");
  await session.prompt("nine");
  assert.equal(count(requests.at(-1), PROFILE), 0, "off adds no guidance");
  assert.deepEqual(stored(), []);
  console.log(JSON.stringify({ ok: true, hostModule: hostPath ?? "@earendil-works/pi-coding-agent", modelRequests: requests.length, profileGuidancePerRequest: 1, storedWorkbenchMessages: 0, busySelectionRefused: true }, null, 2));
} finally {
  session?.dispose();
  await rm(sandbox, { recursive: true, force: true });
}
