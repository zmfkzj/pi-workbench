// Hidden acceptance tests for T1 (run by the grader against the model's final repository state).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repo = process.env.TASK_REPO;
const { toCsv, summarize } = await import(pathToFileURL(join(repo, "src/report.js")).href);
const cols = ["id", "region", "customer", "amount", "note"];
const run = (...args) => execFileSync("node", ["bin/report.js", ...args], { cwd: repo, encoding: "utf8" });

test("toCsv: header, plain values, trailing newline", () => {
  assert.equal(toCsv([{ id: 1, region: "n", customer: "A", amount: 2.5, note: "x" }], cols), "id,region,customer,amount,note\n1,n,A,2.5,x\n");
});
test("toCsv: comma, quote and newline are quoted; quotes doubled", () => {
  assert.equal(toCsv([{ id: 2, region: "s", customer: 'Bolt, "Big" Inc.', amount: 0, note: "a\nb" }], cols),
    'id,region,customer,amount,note\n2,s,"Bolt, ""Big"" Inc.",0,"a\nb"\n');
});
test("toCsv: null and undefined are empty, other falsy values kept", () => {
  assert.equal(toCsv([{ id: 0, region: null, customer: undefined, amount: false, note: "" }], cols), "id,region,customer,amount,note\n0,,,false,\n");
});
test("toCsv: empty rows give the header only and column order follows the argument", () => {
  assert.equal(toCsv([], cols), "id,region,customer,amount,note\n");
  assert.equal(toCsv([{ a: 1, b: 2 }], ["b", "a"]), "b,a\n2,1\n");
});
test("CLI --csv after and before the path", () => {
  const expected = 'id,region,customer,amount,note\n1,north,Acme,120.5,\n2,south,"Bolt, Inc.",80,rush order\n3,north,"Corner ""Shop""",40,"two\nlines"\n';
  assert.equal(run("data/sample.json", "--csv"), expected);
  assert.equal(run("--csv", "data/sample.json"), expected);
});
test("CLI JSON output unchanged", () => {
  assert.deepEqual(JSON.parse(run("data/sample.json")), { count: 3, total: 240.5, byRegion: { north: 160.5, south: 80 } });
  assert.deepEqual(summarize([{ region: "a", amount: 1 }]), { count: 1, total: 1, byRegion: { a: 1 } });
});
test("no dependencies added", () => {
  const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  assert.equal(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length, 0);
});
