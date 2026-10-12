import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const timer = (text) => execFileSync("node", ["bin/timer.cjs", text], { encoding: "utf8" }).trim();

test("CLI prints the normalized duration", () => {
  assert.equal(timer("25m"), "timer set: 25m (1500 seconds)");
});
