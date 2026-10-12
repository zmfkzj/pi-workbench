// Hidden acceptance tests for task B. The final repository is copied and its src/log.js is replaced by a version whose
// deprecated log() throws, so any remaining call fails; logged events and return values must equal the starting code.
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repo = process.env.TASK_REPO;
const original = process.env.TASK_ORIGINAL;
const preserved = JSON.parse(readFileSync(new URL("./preserved.json", import.meta.url), "utf8"));
const modules = [...readFileSync(join(original, "src/index.js"), "utf8").matchAll(/from "\.\/(.+?)"/g)].map((m) => `src/${m[1]}`);
const copy = mkdtempSync(join(tmpdir(), "logger-hidden-"));
cpSync(repo, copy, { recursive: true, filter: (p) => !p.includes("node_modules") });
const logSource = readFileSync(join(original, "src/log.js"), "utf8");
writeFileSync(join(copy, "src/log.js"), logSource.replace("export function log(level, message, context) {\n", "$&  throw new Error(`deprecated log() called: ${level} ${message}`);\n"));
const INPUTS = [{ id: 1, items: [1, 2, 3], ok: true, failed: false }, { id: 7, items: [], ok: false, failed: true }, { id: 9, items: [5], ok: true, failed: true }];

async function trace(root) {
  const { addSink } = await import(pathToFileURL(join(root, "src/log.js")).href);
  const results = {};
  for (const path of modules) {
    let mod;
    try {
      mod = await import(pathToFileURL(join(root, path)).href);
    } catch (error) {
      results[path] = { importError: String(error.message) };
      continue;
    }
    results[path] = INPUTS.map((input) => {
      const events = [];
      const remove = addSink((event) => events.push(event));
      try {
        const value = mod.run(structuredClone(input));
        const forwarded = mod.forward ? mod.forward((level, message) => events.push({ forwardedTo: "sink", level, message }), [4, 5]) : null;
        return { value, forwarded, events };
      } catch (error) {
        return { error: String(error.message) };
      } finally {
        remove();
      }
    });
  }
  return results;
}

test("src/log.js is unchanged", () => {
  assert.equal(readFileSync(join(repo, "src/log.js"), "utf8"), logSource);
});
const expected = await trace(original);
const actual = await trace(copy);
for (const path of modules) {
  test(`${path}: no deprecated call remains; events and results unchanged`, () => {
    assert.ok(existsSync(join(repo, path)));
    assert.deepEqual(actual[path], expected[path]);
  });
}
test("parameters, locals, member calls, comments and strings named log are untouched", () => {
  for (const [path, lines] of Object.entries(preserved)) {
    const source = readFileSync(join(repo, path), "utf8");
    for (const line of lines) assert.ok(source.includes(line), `${path}: ${line.trim()}`);
  }
});
test("no module still imports the deprecated log binding", () => {
  for (const path of modules) {
    const source = readFileSync(join(repo, path), "utf8");
    assert.doesNotMatch(source, /import\s*\{[^}]*\blog\b[^}]*\}\s*from\s*["']\.\.\/log\.js["']/, path);
  }
});
