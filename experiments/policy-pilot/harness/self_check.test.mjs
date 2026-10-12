// Checks of the pilot harness that need no model: every hidden grader rejects the untouched task and accepts the
// reference solution, the variants rebuild from the baseline commit with the recorded hashes, and the plans
// regenerate with the recorded run order. Run: node --test experiments/policy-pilot/harness/self_check.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pilot = resolve(here, "..");
const repoRoot = resolve(pilot, "..", "..");
const scratch = mkdtempSync(join(tmpdir(), "policy-pilot-check-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const TASKS = ["T1-csv-export", "T2-duration-cli", "T3-migrate-calls", "T4-coolant-decision"];

function grade(task, repo) {
  const dir = join(pilot, "tasks", task);
  // NODE_TEST_CONTEXT would make the nested `node --test` report to this runner instead of exiting with its own status.
  const { NODE_TEST_CONTEXT, ...inherited } = process.env;
  const env = { ...inherited, TASK_REPO: repo, TASK_ORIGINAL: join(dir, "repo"), TMPDIR: scratch };
  if (existsSync(join(dir, "hidden/grade.py"))) {
    const result = spawnSync("python3", [join(dir, "hidden/grade.py"), repo], { env, encoding: "utf8" });
    return JSON.parse(result.stdout).checks.acceptance === true;
  }
  return spawnSync("node", ["--test", join(dir, "hidden/acceptance.test.mjs")], { env, encoding: "utf8" }).status === 0;
}

for (const task of TASKS) {
  test(`${task}: hidden grader rejects the starting repository and accepts the reference solution`, () => {
    const original = join(scratch, `${task}-original`);
    const solved = join(scratch, `${task}-reference`);
    cpSync(join(pilot, "tasks", task, "repo"), original, { recursive: true });
    cpSync(join(pilot, "tasks", task, "repo"), solved, { recursive: true });
    const applied = spawnSync("git", ["apply", "--unsafe-paths", join(pilot, "tasks", task, "reference.diff")], { cwd: solved, encoding: "utf8" });
    assert.equal(applied.status, 0, applied.stderr);
    assert.equal(grade(task, original), false);
    assert.equal(grade(task, solved), true);
  });
}

test("variants rebuild from the baseline commit with the recorded hashes and diffs", () => {
  const snapshot = join(scratch, "snapshot");
  mkdirSync(snapshot);
  const archive = spawnSync("sh", ["-c", `git -C "${repoRoot}" archive 3016176fe38ea3b51bc5654c083d56f211525de0 | tar -x -C "${snapshot}"`]);
  assert.equal(archive.status, 0);
  const out = join(scratch, "variants");
  const built = spawnSync("python3", [join(here, "make_variants.py"), snapshot, out], { encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(out, "hashes.json"), "utf8")), JSON.parse(readFileSync(join(pilot, "variants", "hashes.json"), "utf8")));
  for (const name of Object.keys(JSON.parse(readFileSync(join(out, "hashes.json"), "utf8")))) {
    assert.equal(readFileSync(join(out, `${name}.diff`), "utf8"), readFileSync(join(pilot, "variants", `${name}.diff`), "utf8"), name);
  }
});

test("plans regenerate with the recorded matrix and run order", () => {
  for (const stage of ["1", "2"]) {
    const target = join(scratch, `plan-${stage}.json`);
    const made = spawnSync("node", [join(here, "make_plan.mjs"), join(pilot, "variants"), target, stage], { encoding: "utf8" });
    assert.equal(made.status, 0, made.stderr);
    const fresh = JSON.parse(readFileSync(target, "utf8"));
    const recorded = JSON.parse(readFileSync(join(pilot, "results", `plan-stage${stage}.json`), "utf8"));
    assert.deepEqual(fresh.runs, recorded.runs);
    assert.deepEqual(fresh.configs, recorded.configs);
    assert.deepEqual(fresh.limits, recorded.limits);
  }
});
