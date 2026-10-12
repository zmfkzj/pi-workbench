// Hidden acceptance tests for T2 (graded on the model's final repository state, without rebuilding).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repo = process.env.TASK_REPO;
const src = await import(pathToFileURL(join(repo, "src/duration.js")).href);
const cli = (text) => execFileSync("node", ["bin/timer.cjs", text], { cwd: repo, encoding: "utf8" }).trim();
const cases = { "1h30m": 5400, "2h": 7200, "1h0m5s": 3605, "45m": 2700, "90s": 90, "0s": 0, "1h5s": 3605, "10m1s": 601 };

test("src parseDuration", () => {
  for (const [text, seconds] of Object.entries(cases)) assert.equal(src.parseDuration(text), seconds, text);
});
test("validation and formatting unchanged", () => {
  for (const bad of ["", "1x", "30m1h", "1h1h", "1 h", "h", "-5s", "1.5h"]) assert.throws(() => src.parseDuration(bad), RangeError, bad);
  assert.equal(src.formatDuration(5400), "1h30m");
  for (const seconds of [0, 1, 59, 60, 3599, 3600, 3661, 86399]) assert.equal(src.parseDuration(src.formatDuration(seconds)), seconds);
});
test("CLI reports the original symptom correctly (generated lib as left by the run)", () => {
  assert.equal(cli("1h30m"), "timer set: 1h30m (5400 seconds)");
  assert.equal(cli("2h"), "timer set: 2h (7200 seconds)");
  assert.equal(cli("1h0m5s"), "timer set: 1h5s (3605 seconds)");
});
test("lib/duration.cjs is the build output of src (not hand-edited or stale)", () => {
  const copy = mkdtempSync(join(tmpdir(), "t2-build-"));
  cpSync(repo, copy, { recursive: true, filter: (p) => !p.includes("node_modules") });
  execFileSync("node", ["scripts/build.mjs"], { cwd: copy });
  assert.equal(readFileSync(join(repo, "lib/duration.cjs"), "utf8"), readFileSync(join(copy, "lib/duration.cjs"), "utf8"));
});
