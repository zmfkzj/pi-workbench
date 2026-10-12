// Hidden acceptance tests for task A (graded on the final repository; TASK_ORIGINAL is the untouched starting repository).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repo = process.env.TASK_REPO;
const original = process.env.TASK_ORIGINAL;
const { exportFile } = await import(pathToFileURL(join(repo, "src/api.js")).href);
const cli = (cwd, ...args) => spawnSync("node", ["bin/ledger.js", ...args], { cwd, encoding: "utf8" });
const data = mkdtempSync(join(tmpdir(), "ledger-hidden-"));
const file = (name, text) => { const path = join(data, name); writeFileSync(path, text); return path; };
const en = file("en.csv", 'date,account,description,amount\n2026-08-01,4000,A,"1,000.00"\n2026-08-02,6100,B,(1000.00)\n2026-08-03,6100,C,999.99\n2026-08-04,4000,D,"$2,500.10"\n2026-08-05,6200,E,−1000.01\n');
const de = file("de.csv", '#locale=de\ndate,account,description,amount\n2026-08-01,4000,A,"1.234,50"\n2026-08-02,6100,B,"(1.234,50)"\n2026-08-03,6100,C,"1.234,49"\n2026-08-04,4000,D,"€ 10.000,00"\n');
const descriptions = (out) => JSON.parse(out).records.map((r) => r.description);

test("en threshold: absolute value, boundary included, negatives in all notations", () => {
  const out = exportFile(en, { format: "json", minAmount: "1,000.00" });
  assert.deepEqual(descriptions(out), ["A", "B", "D", "E"]);
  assert.equal(JSON.parse(out).total, 100000 - 100000 + 250010 - 100001);
});
test("de threshold uses the file's locale, with and without currency prefix", () => {
  assert.deepEqual(descriptions(exportFile(de, { format: "json", minAmount: "1.234,50" })), ["A", "B", "D"]);
  assert.deepEqual(descriptions(exportFile(de, { format: "json", minAmount: "€ 1.234,50" })), ["A", "B", "D"]);
  assert.deepEqual(descriptions(exportFile(de, { format: "json", minAmount: "5.000" })), ["D"]);
});
test("threshold in the wrong notation for the file is rejected", () => {
  assert.throws(() => exportFile(de, { minAmount: "1,234.50" }), RangeError);
  assert.throws(() => exportFile(en, { minAmount: "1.234,50" }), RangeError);
});
test("negative or unparsable thresholds are rejected by the API", () => {
  for (const bad of ["-5.00", "(5.00)", "−5.00", "abc", ""]) assert.throws(() => exportFile(en, { minAmount: bad }), RangeError, bad);
});
test("CSV total counts only exported rows", () => {
  const out = exportFile(de, { minAmount: "1.234,50" });
  assert.equal(out, 'date,account,description,amount\n2026-08-01,4000,A,"1.234,50"\n2026-08-02,6100,B,"-1.234,50"\n2026-08-04,4000,D,"10.000,00"\n,,TOTAL,"10.000,00"\n');
});
test("CLI: option before or after the file, json and csv", () => {
  const after = cli(repo, "export", en, "--format", "json", "--min-amount", "1,000.00");
  const before = cli(repo, "export", "--min-amount", "1,000.00", en, "--format", "json");
  assert.equal(after.status, 0, after.stderr);
  assert.deepEqual(descriptions(after.stdout), ["A", "B", "D", "E"]);
  assert.equal(before.stdout, after.stdout);
  assert.equal(cli(repo, "export", de, "--min-amount", "1.234,50").stdout, exportFile(de, { minAmount: "1.234,50" }));
});
test("CLI: invalid threshold is reported like other input errors (exit 2, error: on stderr, no output)", () => {
  for (const args of [["--min-amount", "-5.00"], ["--min-amount", "abc"], ["--min-amount"]]) {
    const result = cli(repo, "export", en, ...args);
    assert.equal(result.status, 2, args.join(" "));
    assert.match(result.stderr, /^error: /, args.join(" "));
    assert.equal(result.stdout, "", args.join(" "));
  }
});
test("without the option the output is unchanged", () => {
  for (const args of [["data/q3-en.csv"], ["data/q3-de.csv", "--format", "json"], [en], [de, "--format", "json"]]) {
    assert.equal(cli(repo, "export", ...args).stdout, cli(original, "export", ...args).stdout, args.join(" "));
  }
  assert.equal(cli(repo, "export", "missing.csv").status, 2);
});
test("no dependencies added and existing tests still pass", () => {
  const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  assert.equal(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length, 0);
  // The starting repository's own tests, run against the final code (a copy, so edits to test/ do not matter).
  const copy = mkdtempSync(join(tmpdir(), "ledger-visible-"));
  cpSync(repo, copy, { recursive: true, filter: (p) => !p.includes("node_modules") });
  rmSync(join(copy, "test"), { recursive: true, force: true });
  cpSync(join(original, "test"), join(copy, "test"), { recursive: true });
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const visible = spawnSync("node", ["--test"], { cwd: copy, encoding: "utf8", env });
  assert.equal(visible.status, 0, visible.stdout.slice(-800));
});
