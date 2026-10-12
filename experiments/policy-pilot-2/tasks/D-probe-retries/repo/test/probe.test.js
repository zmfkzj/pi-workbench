import assert from "node:assert/strict";
import test from "node:test";
import { resolveSettings, runProbe } from "../src/probe.js";

test("defaults and overrides", () => {
  assert.equal(resolveSettings().retries, 3);
  assert.equal(resolveSettings({ retries: 2 }).retries, 2);
  assert.equal(resolveSettings({ retries: -1 }).retries, 3);
});

test("attempts", async () => {
  assert.deepEqual(await runProbe({ retries: 2, url: "u", timeout_ms: 1 }, async () => false), { ok: false, attempts: 3 });
  assert.deepEqual(await runProbe({ retries: 2, url: "u", timeout_ms: 1 }, async () => true), { ok: true, attempts: 1 });
});
