import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { summarize } from "../src/report.js";

test("summarize totals by region", () => {
  assert.deepEqual(summarize([{ region: "a", amount: 2 }, { region: "b", amount: "3" }, { region: "a", amount: 1 }]), {
    count: 3, total: 6, byRegion: { a: 3, b: 3 },
  });
});

test("CLI prints the JSON summary", () => {
  const out = execFileSync("node", ["bin/report.js", "data/sample.json"], { encoding: "utf8" });
  assert.deepEqual(JSON.parse(out), { count: 3, total: 240.5, byRegion: { north: 160.5, south: 80 } });
});
