// Hidden acceptance tests for task D (graded on the final repository; TASK_ORIGINAL is the starting repository).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repo = process.env.TASK_REPO;
const original = process.env.TASK_ORIGINAL;
const { parseConfig } = await import(pathToFileURL(join(repo, "src/config.js")).href);
const { resolveSettings } = await import(pathToFileURL(join(repo, "src/probe.js")).href);
const dir = mkdtempSync(join(tmpdir(), "probe-hidden-"));
const probe = (text) => {
  const path = join(dir, `c${Math.random().toString(36).slice(2)}.conf`);
  writeFileSync(path, text);
  const result = spawnSync("node", ["bin/probe.js", "--config", path], { cwd: repo, encoding: "utf8" });
  return result.status === 0 ? result.stdout : `exit ${result.status}: ${result.stderr}`;
};

test("the reported command now gives one attempt, 250 ms and the full URL", () => {
  const result = spawnSync("node", ["bin/probe.js", "--config", "examples/fail-fast.conf"], { cwd: repo, encoding: "utf8" });
  assert.equal(result.stdout, "url: https://pay.internal/health#status\ntimeout_ms: 250\nattempts: 1\n");
});
test("retries 0 without a comment, and retries with a comment", () => {
  assert.match(probe("retries: 0\n"), /attempts: 1\n/);
  assert.match(probe("retries: 2 # two\n"), /attempts: 3\n/);
  assert.match(probe("retries: 1\t# tab before comment\n"), /attempts: 2\n/);
  assert.equal(resolveSettings({ retries: 0 }).retries, 0);
});
test("defaults and invalid values still fall back", () => {
  assert.match(probe('url: "http://x"\n'), /attempts: 4\n/);
  assert.match(probe("retries: -1\n"), /attempts: 4\n/);
  assert.match(probe("retries: many # oops\n"), /attempts: 4\n/);
  assert.match(probe("timeout_ms: 0 # zero is invalid\n"), /timeout_ms: 1000\n/);
});
test("# inside quotes, escaped quotes and # without preceding whitespace are part of the value", () => {
  assert.deepEqual(parseConfig('a: "x # y" # note\nb: "say \\"#hi\\"" # c\nc: tag#1\nd: a # b\n  # indented comment\ne: "\\\\" # backslash\n'),
    { a: "x # y", b: 'say "#hi"', c: "tag#1", d: "a", e: "\\" });
  assert.deepEqual(parseConfig("f: # only a comment\n"), { f: "" });
});
test("errors are still reported", () => {
  assert.throws(() => parseConfig('a: "open # not closed\n'), SyntaxError);
  assert.throws(() => parseConfig('a: "x" trailing\n'), SyntaxError);
  assert.throws(() => parseConfig("no colon\n"), SyntaxError);
});
test("the starting repository's tests pass against the final code", () => {
  const copy = mkdtempSync(join(tmpdir(), "probe-visible-"));
  cpSync(repo, copy, { recursive: true, filter: (p) => !p.includes("node_modules") });
  rmSync(join(copy, "test"), { recursive: true, force: true });
  cpSync(join(original, "test"), join(copy, "test"), { recursive: true });
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const visible = spawnSync("node", ["--test"], { cwd: copy, encoding: "utf8", env });
  assert.equal(visible.status, 0, visible.stdout.slice(-800));
});
