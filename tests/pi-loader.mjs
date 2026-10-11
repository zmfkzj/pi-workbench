// Optional real-host integration check. Install Pi separately or set the module path.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hostSpecifier = process.env.PI_WORKBENCH_HOST_MODULE
  ? pathToFileURL(resolve(process.env.PI_WORKBENCH_HOST_MODULE)).href
  : "@earendil-works/pi-coding-agent";
const host = await import(hostSpecifier);
const sandbox = await mkdtemp(join(tmpdir(), "pi-workbench-host-"));
try {
  const cwd = join(sandbox, "project");
  const agentDir = join(sandbox, "agent");
  await mkdir(cwd);
  await mkdir(agentDir);
  const loader = new host.DefaultResourceLoader({
    cwd, agentDir,
    settingsManager: host.SettingsManager.inMemory({ packages: [root] }),
    noPromptTemplates: true, noThemes: true, noContextFiles: true,
  });
  await loader.reload();
  const extensions = loader.getExtensions();
  assert.deepEqual(extensions.errors, []);
  const installed = extensions.extensions.filter((extension) => extension.commands.has("workbench"));
  assert.equal(installed.length, 1, "Exactly one Workbench extension must register.");
  assert(installed[0].handlers.has("context"), "Profile guidance is projected per request through the context event.");
  assert(installed[0].handlers.has("before_agent_start"));
  const skills = loader.getSkills();
  assert.deepEqual(skills.diagnostics, []);
  const expected = ["requirements", "game", "analysis", "vision", "manufacturing", "coding", "promo"].map((id) => `wb-${id}`).sort();
  assert.deepEqual(skills.skills.map((skill) => skill.name).sort(), expected, "Discover only the seven routing skills, not all vendor skills.");
  assert(skills.skills.every((skill) => skill.filePath.startsWith(join(root, "skills"))));
  console.log(JSON.stringify({ ok: true, hostModule: hostSpecifier, registeredCommands: ["workbench"], discoveredSkills: expected, extensionErrors: 0, skillDiagnostics: 0 }, null, 2));
} finally {
  await rm(sandbox, { recursive: true, force: true });
}
