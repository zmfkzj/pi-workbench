// Shared exact-version guard for the real-host checks. These checks are optional for the standalone package's unit suite,
// but mandatory in the umbrella's Pi compatibility gate; an absent/mismatched host is an error, never a skip.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const expected = process.env.OMP_PI_VERSION || "1.3.0";
export const hostPath = process.env.PI_WORKBENCH_HOST_MODULE ? resolve(process.env.PI_WORKBENCH_HOST_MODULE)
  : fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
const sibling = (name, envName) => {
  if (process.env[envName]) return resolve(process.env[envName]);
  const hostDir = dirname(dirname(hostPath));
  const found = [join(hostDir, "node_modules/@earendil-works", name, "dist/index.js"), join(hostDir, "..", name, "dist/index.js")].find(existsSync);
  assert.ok(found, `Pi ${expected} check needs ${name} beside ${hostPath}; set ${envName}`);
  return found;
};
async function load(name, path) {
  const manifest = JSON.parse(readFileSync(join(dirname(dirname(path)), "package.json"), "utf8"));
  assert.equal(manifest.name, `@earendil-works/${name}`);
  assert.equal(manifest.version, expected, `${name} at ${path}: expected ${expected}`);
  console.log(`Workbench host check: ${name}@${manifest.version} -> ${path}`);
  return import(pathToFileURL(path).href);
}
export const host = await load("pi-coding-agent", hostPath);
export const ai = await load("pi-ai", sibling("pi-ai", "PI_WORKBENCH_AI_MODULE"));
export const tui = await load("pi-tui", sibling("pi-tui", "PI_WORKBENCH_TUI_MODULE"));
