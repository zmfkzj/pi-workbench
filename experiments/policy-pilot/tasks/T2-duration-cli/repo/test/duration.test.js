import assert from "node:assert/strict";
import test from "node:test";
import { formatDuration, isValidDuration, parseDuration, tokens } from "../src/duration.js";

test("single units", () => {
  assert.equal(parseDuration("45s"), 45);
  assert.equal(parseDuration("0s"), 0);
});

test("validation", () => {
  for (const ok of ["1h", "1h30m", "2m5s", "0s"]) assert.ok(isValidDuration(ok), ok);
  for (const bad of ["", "1x", "30m1h", "1h1h", "1 h", "h", "-5s", "1.5h"]) assert.ok(!isValidDuration(bad), bad);
  assert.throws(() => parseDuration("30m1h"), RangeError);
  assert.deepEqual(tokens("1h5s"), [[1, "h"], [5, "s"]]);
});

test("format", () => {
  assert.equal(formatDuration(5400), "1h30m");
  assert.equal(formatDuration(61), "1m1s");
  assert.equal(formatDuration(0), "0s");
});
