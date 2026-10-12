import assert from "node:assert/strict";
import test from "node:test";
import { parseConfig, parseValue } from "../src/config.js";

test("values", () => {
  assert.equal(parseValue(' "a \\"b\\" c"'), 'a "b" c');
  assert.equal(parseValue(" 42"), 42);
  assert.equal(parseValue(" true"), true);
  assert.equal(parseValue(" plain text"), "plain text");
  assert.throws(() => parseValue(' "open'), SyntaxError);
});

test("config lines", () => {
  assert.deepEqual(parseConfig('# probe\nurl: "http://x/y"\n\nretries: 2\n'), { url: "http://x/y", retries: 2 });
  assert.throws(() => parseConfig("no colon"), SyntaxError);
});
