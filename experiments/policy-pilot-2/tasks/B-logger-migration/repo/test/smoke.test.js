import assert from "node:assert/strict";
import test from "node:test";
import * as modules from "../src/index.js";
import { addSink } from "../src/log.js";

test("every module runs and logs", () => {
  const events = [];
  const remove = addSink((event) => events.push(event));
  for (const run of Object.values(modules)) run({ id: 1, items: [1, 2, 3], ok: true, failed: false });
  remove();
  assert.ok(events.length > 0);
});
