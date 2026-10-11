// Optional real-host editor check: Pi's own text editor (pi-tui Editor) with the slash-command autocomplete built as Pi's interactive
// mode builds it (built-in commands, then extension commands with their argument completion) and the wrapper this package registers
// at session start (ctx.ui.addAutocompleteProvider). Key presses go through the editor exactly as typed; no terminal is drawn.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hostPath = process.env.PI_WORKBENCH_HOST_MODULE ? resolve(process.env.PI_WORKBENCH_HOST_MODULE) : undefined;
const host = await import(hostPath ? pathToFileURL(hostPath).href : "@earendil-works/pi-coding-agent");
const sibling = (relativePath, envName) => {
  const candidates = hostPath ? [
    join(dirname(hostPath), "..", "node_modules", "@earendil-works", ...relativePath),
    join(dirname(hostPath), "..", "..", ...relativePath),
  ] : [];
  const found = process.env[envName] ? resolve(process.env[envName]) : candidates.find((path) => existsSync(path));
  return found ? pathToFileURL(found).href : `@earendil-works/${relativePath.join("/").replace("/dist/index.js", "")}`;
};
const tui = await import(sibling(["pi-tui", "dist", "index.js"], "PI_WORKBENCH_TUI_MODULE"));
const { BUILTIN_SLASH_COMMANDS } = await import(hostPath ? pathToFileURL(join(dirname(hostPath), "core", "slash-commands.js")).href : "@earendil-works/pi-coding-agent/dist/core/slash-commands.js");

const sandbox = await mkdtemp(join(tmpdir(), "pi-workbench-editor-"));
let session;
try {
  const cwd = join(sandbox, "project");
  const agentDir = join(sandbox, "agent");
  await mkdir(cwd);
  await mkdir(agentDir);
  await writeFile(join(cwd, "alpha.txt"), "a\n");
  await writeFile(join(cwd, "use-me.md"), "b\n");
  const settingsManager = host.SettingsManager.inMemory({ packages: [root], compaction: { enabled: false } });
  const resourceLoader = new host.DefaultResourceLoader({ cwd, agentDir, settingsManager, noPromptTemplates: true, noThemes: true, noContextFiles: true });
  await resourceLoader.reload();
  ({ session } = await host.createAgentSession({ cwd, agentDir, resourceLoader, settingsManager, sessionManager: host.SessionManager.inMemory(cwd) }));
  const wrappers = [];
  await session.bindExtensions({ uiContext: { notify() {}, addAutocompleteProvider: (factory) => wrappers.push(factory) }, mode: "tui" });
  assert.equal(wrappers.length, 1, "Workbench registers one autocomplete wrapper at session start.");

  // Pi's interactive mode: built-ins, then extension commands under their invocation name, then its registered wrappers in order.
  const builtins = new Set(BUILTIN_SLASH_COMMANDS.map((command) => command.name));
  const commands = [
    ...BUILTIN_SLASH_COMMANDS.map((command) => ({ name: command.name, description: command.description })),
    ...session.extensionRunner.getRegisteredCommands().filter((command) => !builtins.has(command.name))
      .map((command) => ({ name: command.invocationName, description: command.description, getArgumentCompletions: command.getArgumentCompletions })),
  ];
  const base = new tui.CombinedAutocompleteProvider(commands, cwd, null);
  const wrapped = wrappers.reduce((provider, wrap) => wrap(provider), base);

  const identity = (text) => text;
  const theme = { borderColor: identity, selectList: { selectedPrefix: identity, selectedText: identity, description: identity, scrollInfo: identity, noMatch: identity } };
  const settle = () => new Promise((resolveTick) => setTimeout(resolveTick, 40));
  const keys = { tab: "\t", enter: "\r", escape: "\x1b" };
  /** Types `steps` (strings are typed character by character, `{ key }` presses a key) and reports the editor afterwards. */
  async function drive(provider, steps) {
    const editor = new tui.Editor({ requestRender() {} }, theme);
    editor.setAutocompleteProvider(provider);
    const submitted = [];
    editor.onSubmit = (text) => submitted.push(text);
    const seen = [];
    for (const step of steps) {
      const presses = typeof step === "string" ? [...step] : [keys[step.key]];
      for (const press of presses) {
        editor.handleInput(press);
        await settle();
      }
      seen.push({ text: editor.getText(), list: editor.isShowingAutocomplete() ? editor.autocompleteList.filteredItems.map((item) => item.value) : null });
    }
    return { submitted, seen, last: seen.at(-1) };
  }
  const tab = { key: "tab" };
  const enter = { key: "enter" };
  const escape = { key: "escape" };
  const subcommands = ["list", "use ", "skill ", "cancel", "status", "doctor", "help"];
  const catalog = JSON.parse(await (await import("node:fs/promises")).readFile(join(root, "catalog.json"), "utf8"));
  const profileValues = catalog.profiles.map((profile) => `use ${profile.id}`);

  // Before: Pi's own provider (no wrapper) with the list closed gives nothing after `/workbench ` and the project's files after `use `.
  assert.equal((await drive(base, ["/wor", tab, tab])).last.list, null, "without the wrapper: no candidates after /workbench + space");
  assert.deepEqual((await drive(base, ["/workbench use ", escape, tab])).last.list, ["alpha.txt", "use-me.md"], "without the wrapper: the project's files");

  // 1. The command picked from the list, then Tab at each argument position, then Enter: the chosen arguments, no file list.
  const flow = await drive(wrapped, ["/wor", tab, tab, "u", tab, tab, "co", enter, enter]);
  assert.equal(flow.seen[1].text, "/workbench ", "the command is completed with its space");
  assert.deepEqual(flow.seen[2].list, subcommands, "Tab after /workbench + space lists the subcommands");
  assert.deepEqual(flow.seen[3].list, ["use "]);
  assert.equal(flow.seen[4].text, "/workbench use ");
  assert.deepEqual(flow.seen[5].list, [...profileValues, "use auto", "use off"], "Tab after use + space lists profiles");
  assert.deepEqual(flow.seen[6].list, ["use coding"]);
  assert.equal(flow.seen[7].text, "/workbench use coding", "Enter applies the argument without submitting");
  assert.deepEqual(flow.submitted, ["/workbench use coding"], "the second Enter submits it");

  // 2. Each argument position after Tab with the list closed (Escape), including an id that prefixes a longer one.
  assert.deepEqual((await drive(wrapped, ["/workbench ", escape, tab])).last.list, subcommands);
  assert.deepEqual((await drive(wrapped, ["/workbench use ", escape, tab])).last.list, [...profileValues, "use auto", "use off"]);
  const skills = await drive(wrapped, ["/workbench skill ", escape, tab]);
  assert.deepEqual(skills.last.list, catalog.skills.map((skill) => `skill ${skill.id}`));
  const lists = await drive(wrapped, ["/workbench list ", escape, tab]);
  assert.deepEqual(lists.last.list, catalog.profiles.map((profile) => `list ${profile.id}`));
  const typedExact = await drive(wrapped, ["/workbench skill ponytail", enter, enter]);
  assert.deepEqual(typedExact.seen[0].list, ["skill ponytail", "skill ponytail-review"], "typed: both offered while typing");
  assert.equal(typedExact.seen[1].text, "/workbench skill ponytail", "typed: Enter keeps the exact id");
  assert.deepEqual(typedExact.submitted, ["/workbench skill ponytail"], "typed: one submission, of the exact id");
  const exact = await drive(wrapped, ["/workbench skill ponytail", escape, tab, enter, enter]);
  assert.deepEqual(exact.seen[2].list, ["skill ponytail", "skill ponytail-review"], "the exact id and the longer one are both offered");
  assert.equal(exact.seen[3].text, "/workbench skill ponytail", "Enter keeps the exact id: no substitution by the longer one");
  assert.deepEqual(exact.submitted, ["/workbench skill ponytail"], "and only the following Enter submits");
  const single = await drive(wrapped, ["/workbench skill ponytail-r", escape, tab, enter]);
  assert.equal(single.seen[2].text, "/workbench skill ponytail-review", "a single candidate is applied by Tab");
  assert.deepEqual(single.submitted, ["/workbench skill ponytail-review"]);
  const whole = await drive(wrapped, ["/workbench   use   ga", escape, tab]);
  assert.equal(whole.last.text, "/workbench use game", "the whole argument is replaced by the candidate");

  // 3. Nothing to offer stays nothing, never a file list; finished arguments submit with one Enter.
  for (const line of ["/workbench xyz ", "/workbench use coding ", "/workbench status "]) {
    const result = await drive(wrapped, [line, tab]);
    assert.equal(result.last.list, null, line);
    assert.equal(result.last.text, line, line);
  }
  assert.deepEqual((await drive(wrapped, ["/workbench status", enter])).submitted, ["/workbench status"]);

  // 4. Everything else is Pi's: other commands, file paths, natural typing.
  assert.deepEqual((await drive(wrapped, ["/model ", tab])).last.list, (await drive(base, ["/model ", tab])).last.list, "other commands unchanged");
  assert.deepEqual((await drive(wrapped, ["look at ", tab])).last.list, ["alpha.txt", "use-me.md"], "file completion unchanged");
  const typed = await drive(wrapped, ["/workbench u", tab, "c", tab, enter]);
  assert.deepEqual(typed.submitted, ["/workbench use coding"], "typing → candidates → Tab → Enter still works");

  // 5. A pending selection is offered to cancel, at the same forced Tab.
  await session.prompt("/workbench skill ponytail");
  assert.deepEqual((await drive(wrapped, ["/workbench cancel ", tab])).last.text, "/workbench cancel ponytail", "the only pending id is applied");

  console.log(JSON.stringify({ ok: true, hostModule: hostPath ?? "@earendil-works/pi-coding-agent", forcedTab: ["/workbench ", "use ", "skill ", "list ", "cancel "], fileListAtArguments: false, otherCompletionUnchanged: true }, null, 2));
} finally {
  session?.dispose();
  await rm(sandbox, { recursive: true, force: true });
}
