// Hidden acceptance tests for T3. The grader copies the final repository and replaces src/http.js with a version whose
// oldFetch throws, so any remaining direct call fails; request shapes must equal those of the original code.
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repo = process.env.TASK_REPO;
const original = process.env.TASK_ORIGINAL;
const copy = mkdtempSync(join(tmpdir(), "t3-"));
cpSync(repo, copy, { recursive: true });
const httpSource = readFileSync(join(repo, "src/http.js"), "utf8");
writeFileSync(join(copy, "src/http.js"), httpSource.replace(/export async function oldFetch\(url, options = \{\}\) \{\n/, "$&  throw new Error(\"oldFetch called\");\n"));
const load = (dir, name) => import(pathToFileURL(join(dir, "src", name)).href);
const read = (dir, name) => readFileSync(join(dir, "src", name), "utf8");

async function requests(dir) {
  const http = await load(dir, "http.js");
  const seen = [];
  http.transport.send = async (request) => { seen.push(request); return { ok: true, request }; };
  const users = await load(dir, "users.js");
  const orders = await load(dir, "orders.js");
  const search = await load(dir, "search.js");
  const admin = await load(dir, "admin.js");
  await users.getUser(3);
  await users.updateUser(3, { name: "N" });
  await orders.getOrder(9);
  await orders.cancelOrder(9, "late");
  await search.search("a b", { headers: { x: "1" } });
  await search.search("c");
  await search.suggest("ab");
  await admin.listAudits("/log", { method: "DELETE" });
  await admin.listAudits("/log");
  await admin.ping();
  const legacy = await orders.auditOrder(5);
  return { seen, legacy, count: orders.oldFetchCount, help: orders.help() };
}

test("http.js keeps exporting oldFetch unchanged", () => {
  assert.equal(httpSource, read(original, "http.js"));
});
test("no direct oldFetch call remains and every request is unchanged", async () => {
  const expected = await requests(original);
  const actual = await requests(copy);
  assert.deepEqual(actual, expected);
});
test("comments, strings, variable names and the legacy client call are unchanged", () => {
  const orders = read(repo, "orders.js");
  for (const line of ["// oldFetch(url) is deprecated; this module is being migrated.", 'const HELP = "call oldFetch( only through the order API";',
    "export let oldFetchCount = 0;", '  return client.oldFetch("audit", id);', "  oldFetchCount++;"]) assert.ok(orders.includes(line), line);
  assert.equal(read(repo, "legacy-client.js"), read(original, "legacy-client.js"));
});
test("unused imports removed", () => {
  for (const name of ["users.js", "orders.js", "search.js"]) {
    const source = read(repo, name);
    const imports = source.split("\n").filter((l) => l.startsWith("import ") && l.includes("./http.js")).join("\n");
    assert.doesNotMatch(imports, /oldFetch/, name);
  }
});
