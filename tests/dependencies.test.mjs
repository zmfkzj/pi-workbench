import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  DEPENDENCY_CHANNEL,
  DEPENDENCY_CONTRACT_VERSION,
  dependencyLevel,
  dependencyOutcome,
  findExecutable,
  formatDependencyItems,
  formatDependencyReport,
  insideNodeModules,
  isDependencyRequest,
  registerDependencyProvider,
} from "../lib/dependencies.js";
import { checkWorkbenchDependencies, createWorkbenchDependencyProvider, installWorkbenchDependencies } from "../lib/runtime.js";
import { TOOLS, VARIABLES, toolAction, variableAction } from "../lib/workbench-dependencies.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const TOOL_NAMES = ["git", "rg", "node", "python3", "python", "uv", "ffmpeg", "ffprobe", "blender", "godot", "ast-grep"];
const VARIABLE_NAMES = ["OPENAI_API_KEY", "ELEVENLABS_API_KEY", "SCENARIO_API_KEY", "CONTEXT7_API_KEY", "LAYER_API_KEY"];
const SECRET = "DO-NOT-LEAK-SENTINEL";

async function temporaryDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), "pi-workbench-deps-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

/** Executables that record any run in `marker`: presence checks must never execute them. */
async function stubs(directory, names, marker) {
  await mkdir(directory, { recursive: true });
  for (const name of names) {
    await writeFile(join(directory, name), `#!/bin/sh\nprintf executed > '${marker}'\nexit 73\n`);
    await chmod(join(directory, name), 0o755);
  }
}

const secrets = (names = VARIABLE_NAMES) => Object.fromEntries(names.map((name) => [name, SECRET]));
const byName = (report) => new Map(report.items.map((item) => [item.name, item]));

/**
 * A runner that records its calls and answers with `respond(command, args)`.
 * @param {(command: string, args: string[], options?: any) => any} [respond]
 */
function recorder(respond = () => ({ code: 0, stdout: "", stderr: "" })) {
  const calls = [];
  const run = async (command, args, options) => {
    calls.push([command, ...args]);
    return respond(command, args, options);
  };
  return { calls, run };
}

test("the contract port keeps the channel, outcome, level and formatting of the reference", () => {
  assert.equal(DEPENDENCY_CHANNEL, "oh-my-pi-extensions:dependencies");
  assert.equal(DEPENDENCY_CONTRACT_VERSION, 1);
  assert.equal(dependencyOutcome({ items: [] }, "check"), "no external dependencies");
  assert.equal(dependencyOutcome({ items: [{ name: "a", status: "ok" }] }, "check"), "healthy");
  assert.equal(dependencyOutcome({ items: [{ name: "a", status: "ok" }] }, "install"), "already available");
  assert.equal(dependencyOutcome({ items: [{ name: "a", status: "installed" }] }, "install"), "installed");
  assert.equal(dependencyOutcome({ items: [{ name: "a", status: "unverified" }] }, "check"), "unverified");
  assert.equal(dependencyOutcome({ items: [{ name: "a", status: "warn" }, { name: "b", status: "manual" }] }, "install"), "manual action required");
  assert.equal(dependencyOutcome({ items: [{ name: "a", status: "error" }] }, "check"), "abnormal");
  assert.equal(dependencyOutcome({ items: [{ name: "a", status: "failed" }] }, "install"), "failed");
  assert.equal(dependencyLevel({ items: [{ name: "a", status: "ok" }, { name: "b", status: "installed" }] }), "info");
  assert.equal(dependencyLevel({ items: [{ name: "a", status: "unverified" }] }), "warning");
  assert.equal(dependencyLevel({ items: [{ name: "a", status: "warn" }, { name: "b", status: "failed" }] }), "error");
  assert.deepEqual(formatDependencyItems({ items: [] }), ["  No external dependencies."]);
  assert.deepEqual(formatDependencyReport("pkg", { note: "Note.", items: [{ name: "tool", status: "warn", optional: true, detail: "missing", action: "install it" }, { name: "core", status: "ok" }] }, "check"), {
    text: "pkg doctor: warning\n  Note.\n  [warn] tool (optional): missing\n      -> install it\n  [ok] core",
    level: "warning",
  });
  assert.equal(formatDependencyReport("pkg", { items: [] }, "install").text, "pkg install-deps: no external dependencies\n  No external dependencies.");
  assert.equal(isDependencyRequest({ version: 1, provide() {} }), true);
  assert.equal(isDependencyRequest({ version: 1 }), false);
  assert.equal(insideNodeModules(join("a", "node_modules", "b")), true);
  assert.equal(insideNodeModules(packageRoot), false);
  const answered = [];
  const handlers = [];
  const off = registerDependencyProvider({ on: (channel, handler) => { handlers.push([channel, handler]); return () => "off"; } }, /** @type {any} */ ({ id: "x" }));
  assert.equal(off(), "off");
  handlers[0][1]({ version: 1, provide: (provider) => answered.push(provider.id) });
  handlers[0][1]("not a request");
  assert.deepEqual(answered, ["x"]);
});

test("a fully equipped machine is healthy; doctor runs nothing and prints no secret", async (t) => {
  const temporary = await temporaryDirectory(t);
  const bin = join(temporary, "bin");
  const marker = join(temporary, "must-not-execute");
  await stubs(bin, TOOL_NAMES, marker);
  const env = Object.freeze({ PATH: bin, ...secrets() });
  const { calls, run } = recorder();
  const report = await createWorkbenchDependencyProvider(packageRoot, { env, platform: "linux", run }).check({});
  assert.equal(dependencyOutcome(report, "check"), "healthy");
  const { text, level } = formatDependencyReport("pi-workbench", report, "check");
  assert.equal(level, "info");
  assert.match(text, /^pi-workbench doctor: healthy$/m);
  assert.match(text, /\[ok\] bundled catalog and skills: 27 skills in 7 profiles/);
  assert.match(text, /\[ok\] python3 \/ python: python3: found, python: found/);
  for (const name of VARIABLE_NAMES) assert.match(text, new RegExp(`\\[ok\\] ${name}: set$`, "m"));
  assert.match(report.note, /only Pi and Node\.js built-ins/);
  assert.match(report.note, /python3 -c "import numpy, PIL/, "The note says how to verify the unchecked Python modules.");
  assert.doesNotMatch(JSON.stringify(report), /DO-NOT-LEAK|SENTINEL/);
  assert.deepEqual(calls, [], "check never runs an installer or any process");
  await assert.rejects(readFile(marker), { code: "ENOENT" });
});

test("missing tools and variables are optional warnings with the concrete step per platform", async (t) => {
  const temporary = await temporaryDirectory(t);
  const bin = join(temporary, "bin");
  await stubs(bin, ["git", "python"], join(temporary, "marker"));
  const linux = await checkWorkbenchDependencies(packageRoot, { env: { PATH: bin, OPENAI_API_KEY: " \t", ELEVENLABS_API_KEY: SECRET }, platform: "linux" });
  assert.equal(dependencyOutcome(linux, "check"), "warning", "The package works without skill tools: warning, not abnormal.");
  assert.equal(dependencyLevel(linux), "warning");
  const items = byName(linux);
  assert.equal(items.get("bundled catalog and skills").status, "ok");
  assert.equal(items.get("git").status, "ok");
  assert.deepEqual(items.get("python3 / python"), { name: "python3 / python", status: "ok", detail: "python3: not found, python: found on PATH" });
  for (const item of linux.items.filter(({ status }) => status !== "ok")) {
    assert.equal(item.status, "warn", item.name);
    assert.equal(item.optional, true, item.name);
    assert.ok(item.action, `${item.name} carries an action`);
  }
  assert.match(items.get("ast-grep").action, /npm install -g @ast-grep\/cli/);
  assert.match(items.get("ast-grep").detail, /not found on PATH; needed for ast-grep and ast-grep-outline skills \(coding\)/);
  assert.match(items.get("ffmpeg").action, /^sudo apt install ffmpeg \(Debian\/Ubuntu\) or sudo dnf install ffmpeg/);
  assert.match(items.get("uv").action, /pipx install uv/);
  assert.match(items.get("rg").action, /sudo apt install ripgrep/);
  assert.equal(items.get("OPENAI_API_KEY").status, "warn", "A blank value is not set.");
  assert.match(items.get("OPENAI_API_KEY").action, /export OPENAI_API_KEY=<your key>.*platform\.openai\.com\/api-keys/);
  assert.equal(items.get("ELEVENLABS_API_KEY").detail, "set");
  assert.doesNotMatch(JSON.stringify(linux), /SENTINEL/);
  // Every tool and variable doctor probes has a purpose and a step for every platform.
  for (const name of TOOL_NAMES.filter((item) => item !== "python3")) {
    const key = name === "python" ? "python" : name;
    assert.ok(TOOLS[key]?.purpose, name);
    for (const platform of ["linux", "darwin", "win32", "freebsd"]) assert.match(toolAction(key, platform), /\S.*; then restart Pi/, `${name} ${platform}`);
  }
  for (const name of VARIABLE_NAMES) assert.ok(VARIABLES[name], name);
  assert.match(toolAction("ffmpeg", "win32"), /^winget install --id Gyan\.FFmpeg -e/);
  assert.match(toolAction("ffmpeg", "darwin"), /^brew install ffmpeg/);
  assert.match(variableAction("OPENAI_API_KEY", "win32"), /setx OPENAI_API_KEY "<your key>"/);
  const windows = await checkWorkbenchDependencies(packageRoot, { env: { PATH: "" }, platform: "win32" });
  assert.match(byName(windows).get("godot").action, /winget install --id GodotEngine\.GodotEngine -e/);
});

test("a broken package is abnormal with a restore action; install-deps reports it as manual", async (t) => {
  const temporary = await temporaryDirectory(t);
  const root = join(temporary, "package");
  await mkdir(join(root, "vendor"), { recursive: true });
  await writeFile(join(root, "vendor", "a.md"), "---\nname: a\n---\n");
  await writeFile(join(root, "catalog.json"), JSON.stringify({ schemaVersion: 1, profiles: [{ id: "coding", skills: ["a", "b"] }], skills: [{ id: "a", path: "vendor/a.md" }, { id: "b", path: "vendor/b.md" }] }));
  const check = await checkWorkbenchDependencies(root, { env: { PATH: "" }, platform: "linux" });
  const core = byName(check).get("bundled catalog and skills");
  assert.equal(core.status, "error");
  assert.equal(core.optional, undefined, "The package files are required.");
  assert.match(core.detail, /1 of 2 skill files missing or outside the package: b/);
  assert.match(core.action, /pi update --extensions/);
  assert.match(core.action, /git -C .* checkout -- catalog\.json skills vendor/);
  assert.equal(dependencyOutcome(check, "check"), "abnormal");
  assert.equal(dependencyLevel(check), "error");
  const install = await installWorkbenchDependencies(root, { env: { PATH: "" }, platform: "linux", run: recorder().run });
  assert.equal(byName(install).get("bundled catalog and skills").status, "manual");
  await writeFile(join(root, "catalog.json"), "{ broken");
  const unreadable = byName(await checkWorkbenchDependencies(root, { env: { PATH: "" } })).get("bundled catalog and skills");
  assert.equal(unreadable.status, "error");
  assert.match(unreadable.detail, /^catalog\.json unreadable:/);
});

/** A machine with every tool but ast-grep and uv, npm and pipx on PATH, and an npm prefix and pipx bin dir under `temporary`. */
async function installMachine(t, { pipxBinOnPath = true } = {}) {
  const temporary = await temporaryDirectory(t);
  const bin = join(temporary, "bin");
  const prefix = join(temporary, "npm-prefix");
  const pipxBin = join(temporary, "pipx-bin");
  await stubs(bin, [...TOOL_NAMES.filter((name) => name !== "ast-grep" && name !== "uv"), "npm", "pipx"], join(temporary, "marker"));
  const env = { PATH: [bin, join(prefix, "bin"), ...(pipxBinOnPath ? [pipxBin] : [])].join(delimiter), PIPX_BIN_DIR: pipxBin, ...secrets() };
  const executable = async (directory, name) => {
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, name), "#!/bin/sh\nexit 0\n");
    await chmod(join(directory, name), 0o755);
  };
  return { temporary, bin, prefix, pipxBin, env, executable };
}

test("install-deps installs ast-grep (npm) and uv (pipx) without privileges, re-checks them, and is idempotent", async (t) => {
  const machine = await installMachine(t);
  const { calls, run } = recorder(async (command, args) => {
    if (args.join(" ") === "prefix -g") return { code: 0, stdout: `${machine.prefix}\n`, stderr: "" };
    if (args[0] === "install" && args.includes("@ast-grep/cli")) await machine.executable(join(machine.prefix, "bin"), "ast-grep");
    if (args.join(" ") === "install uv") await machine.executable(machine.pipxBin, "uv");
    return { code: 0, stdout: "done", stderr: "" };
  });
  const options = { env: machine.env, platform: "linux", run, homeDir: machine.temporary };
  const first = await installWorkbenchDependencies(packageRoot, options);
  assert.deepEqual(calls.map((call) => call.slice(1).join(" ")), ["install uv", "prefix -g", "install -g @ast-grep/cli --no-audit --no-fund"]);
  assert.equal(calls[0][0], join(machine.bin, "pipx"));
  assert.equal(calls[1][0], "npm");
  const items = byName(first);
  assert.equal(items.get("ast-grep").status, "installed");
  assert.match(items.get("ast-grep").detail, /installed with npm install -g @ast-grep\/cli: .*ast-grep$/);
  assert.equal(items.get("uv").status, "installed");
  assert.equal(dependencyOutcome(first, "install"), "installed");
  assert.equal(items.get("OPENAI_API_KEY").detail, "already available (set)");
  assert.doesNotMatch(JSON.stringify(first), /SENTINEL/);
  const second = await installWorkbenchDependencies(packageRoot, options);
  assert.equal(calls.length, 3, "Nothing is installed again.");
  assert.ok(second.items.every(({ status }) => status === "ok"), JSON.stringify(second.items.filter(({ status }) => status !== "ok")));
  assert.match(byName(second).get("ast-grep").detail, /^already available/);
  assert.equal(dependencyOutcome(second, "install"), "already available");
});

test("install failures are failed with the error tail and the manual command", async (t) => {
  const machine = await installMachine(t);
  const { run } = recorder((command, args) => {
    if (args.join(" ") === "prefix -g") return { code: 0, stdout: machine.prefix, stderr: "" };
    return { code: 1, stdout: "", stderr: "npm ERR! code E404\nnpm ERR! 404 Not Found" };
  });
  const report = await installWorkbenchDependencies(packageRoot, { env: machine.env, platform: "linux", run });
  const items = byName(report);
  assert.equal(items.get("ast-grep").status, "failed");
  assert.match(items.get("ast-grep").detail, /exited 1: npm ERR! code E404 \| npm ERR! 404 Not Found/);
  assert.match(items.get("ast-grep").action, /^Run by hand and read the error: npm install -g @ast-grep\/cli/);
  assert.equal(items.get("uv").status, "failed");
  assert.match(items.get("uv").action, /pipx install uv/);
  assert.equal(dependencyOutcome(report, "install"), "failed");
  assert.equal(dependencyLevel(report), "error");
});

test("install-deps never escalates: a privileged npm prefix, no npm or pipx, and system tools are manual steps", async (t) => {
  const machine = await installMachine(t, { pipxBinOnPath: false });
  const { calls, run } = recorder(async (command, args) => {
    if (args.join(" ") === "prefix -g") return { code: 0, stdout: "/usr/local", stderr: "" };
    if (args.join(" ") === "install uv") await machine.executable(machine.pipxBin, "uv");
    return { code: 0, stdout: "", stderr: "" };
  });
  const report = await installWorkbenchDependencies(packageRoot, { env: machine.env, platform: "linux", run, isWritable: () => false });
  assert.deepEqual(calls.map((call) => call.slice(1).join(" ")), ["install uv", "prefix -g"], "no npm install -g into a prefix that needs privileges; never sudo");
  assert.ok(!calls.some((call) => call.includes("sudo")));
  const items = byName(report);
  assert.equal(items.get("ast-grep").status, "manual");
  assert.match(items.get("ast-grep").detail, /\/usr\/local is not writable without privileges/);
  assert.match(items.get("ast-grep").action, /npm config set prefix ~\/\.npm-global/);
  assert.equal(items.get("uv").status, "manual", "Installed outside PATH is not reported as installed.");
  assert.match(items.get("uv").action, /pipx ensurepath/);
  assert.match(items.get("uv").action, /export PATH=/);

  const bare = await installWorkbenchDependencies(packageRoot, { env: { PATH: "" }, platform: "linux", run: recorder().run });
  const none = byName(bare);
  assert.equal(none.get("ast-grep").status, "manual");
  assert.match(none.get("ast-grep").detail, /npm is not on PATH/);
  assert.match(none.get("ast-grep").action, /npm install -g @ast-grep\/cli/);
  assert.equal(none.get("uv").status, "manual");
  assert.match(none.get("uv").action, /pipx install uv, or the official installer/);
  assert.equal(none.get("ffmpeg").status, "manual");
  assert.match(none.get("ffmpeg").action, /sudo apt install ffmpeg/);
  assert.equal(none.get("OPENAI_API_KEY").status, "manual");
  assert.match(none.get("OPENAI_API_KEY").detail, /credentials are never written/);
  assert.ok(bare.items.filter(({ status }) => status !== "ok").every(({ action }) => action), "every manual item carries an action");
  assert.equal(dependencyOutcome(bare, "install"), "manual action required");
});

test("overlapping installs share one run", async (t) => {
  const machine = await installMachine(t);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { calls, run } = recorder(async (command, args) => {
    if (args.join(" ") === "prefix -g") return { code: 0, stdout: machine.prefix, stderr: "" };
    await gate;
    if (args.includes("@ast-grep/cli")) await machine.executable(join(machine.prefix, "bin"), "ast-grep");
    if (args.join(" ") === "install uv") await machine.executable(machine.pipxBin, "uv");
    return { code: 0, stdout: "", stderr: "" };
  });
  const provider = createWorkbenchDependencyProvider(packageRoot, { env: machine.env, platform: "linux", run });
  const first = provider.install({});
  const second = provider.install({});
  release?.();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a, b, "The second request gets the run in flight.");
  assert.equal(calls.filter((call) => call[1] === "install").length, 2, "ast-grep and uv installed once each");
  assert.equal(findExecutable("ast-grep", machine.env)?.startsWith(machine.prefix), true);
  const again = await provider.install({});
  assert.notEqual(again, a, "A later request runs again (and finds everything present).");
  assert.equal(dependencyOutcome(again, "install"), "already available");
});
