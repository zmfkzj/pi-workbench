import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { exportFile } from "../src/api.js";

test("csv export with total row", () => {
  const out = exportFile("data/q3-en.csv");
  assert.match(out, /^date,account,description,amount\n/);
  assert.match(out, /,,TOTAL,"13,408.29"\n$/);
});

test("json export keeps cents and locale", () => {
  const out = JSON.parse(exportFile("data/q3-de.csv", { format: "json" }));
  assert.equal(out.locale, "de");
  assert.equal(out.records.length, 5);
  assert.equal(out.total, 840000 - 123450 + 123449 - 1200 + 98000);
});

test("CLI", () => {
  const out = execFileSync("node", ["bin/ledger.js", "export", "--format", "json", "data/q3-en.csv"], { encoding: "utf8" });
  assert.equal(JSON.parse(out).records.length, 6);
});
