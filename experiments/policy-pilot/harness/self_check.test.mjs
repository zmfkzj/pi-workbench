// Checks of the pilot harness that need no model: every hidden grader rejects the untouched task and accepts the
// reference solution, the variants rebuild from the baseline commit with the recorded hashes, and the plans
// regenerate with the recorded run order. Run: node --test experiments/policy-pilot/harness/self_check.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
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
  const results = join(pilot, "results");
  for (const stage of ["1", "2", "3"]) {
    const target = join(scratch, `plan-${stage}.json`);
    const extra = stage === "3" ? [join(results, "shared-tmp-trace.json"), `${join(results, "runs-stage1.jsonl")},${join(results, "runs-stage2.jsonl")}`] : [];
    const made = spawnSync("node", [join(here, "make_plan.mjs"), join(pilot, "variants"), target, stage, ...extra], { encoding: "utf8" });
    assert.equal(made.status, 0, made.stderr);
    const fresh = JSON.parse(readFileSync(target, "utf8"));
    const recorded = JSON.parse(readFileSync(join(pilot, "results", `plan-stage${stage}.json`), "utf8"));
    assert.deepEqual(fresh.runs, recorded.runs);
    assert.deepEqual(fresh.configs, recorded.configs);
    assert.deepEqual(fresh.limits, recorded.limits);
    assert.deepEqual(fresh.isolation, recorded.isolation);
    assert.deepEqual(fresh.replacement, recorded.replacement);
  }
});

const ledger = (name) => readFileSync(join(pilot, "results", name), "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));

test("stage 3 replaces complete pair groups, runs every replacement in the sandbox, and summary.md is regenerated from the records", () => {
  const original = [...ledger("runs-stage1.jsonl"), ...ledger("runs-stage2.jsonl")];
  const stage3 = ledger("runs-stage3.jsonl");
  const plan3 = JSON.parse(readFileSync(join(pilot, "results", "plan-stage3.json"), "utf8"));
  const trace = JSON.parse(readFileSync(join(pilot, "results", "shared-tmp-trace.json"), "utf8"));
  assert.equal(original.length, 90);
  assert.deepEqual(stage3.map((r) => r.runId).sort(), plan3.runs.map((r) => r.runId).sort());
  const mode = (c) => (c.includes("select") ? "select" : c.includes("profile") || c.includes("mfg") ? "profile" : "auto");
  const group = (r) => [r.model.id, r.task, mode(r.config), r.rep].join("|");
  const replaced = new Set(stage3.map((r) => r.replaces));
  for (const trigger of [...trace.runsSharingAResourceWithAnotherRun, ...Object.keys(trace.runsWithUnresolvedTmpUse)]) assert.ok(replaced.has(trigger), trigger);
  const groups = new Set(original.filter((r) => replaced.has(r.runId)).map(group));
  for (const run of original) assert.equal(replaced.has(run.runId), groups.has(group(run)), `${run.runId}: pair groups are replaced whole`);
  for (const run of stage3) {
    const source = original.find((r) => r.runId === run.replaces);
    assert.deepEqual([run.task, run.config, run.rep, run.model.id, run.model.thinking], [source.task, source.config, source.rep, source.model.id, source.model.thinking]);
    assert.equal(run.isolation?.sandbox, "bwrap");
    assert.deepEqual(run.modelsSeen, [`${run.model.id}:${run.model.thinking}`]);
  }
  const files = (names) => names.map((n) => join(pilot, "results", n)).join(",");
  const summary = spawnSync("python3", [join(here, "analyze.py"), files(["runs-stage1.jsonl", "runs-stage2.jsonl", "runs-stage3.jsonl"]), files(["plan-stage1.json", "plan-stage2.json", "plan-stage3.json"]),
    files(["judgements-t4-stage1.jsonl", "judgements-t4-stage2.jsonl", "judgements-t4-stage3.jsonl"])], { encoding: "utf8" });
  assert.equal(summary.status, 0, summary.stderr);
  assert.equal(summary.stdout, readFileSync(join(pilot, "results", "summary.md"), "utf8"));
  assert.match(summary.stdout, /Original runs excluded in the corrected view \(pair group replaced\): 40\./);
});

test("shared /tmp trace: same resource, prefix relation, possible writers, concurrency and unresolved cd /tmp", () => {
  const root = join(scratch, "trace-fixture");
  const event = (id, tool, args) => [JSON.stringify({ type: "tool_execution_start", toolCallId: id, toolName: tool, args }), JSON.stringify({ type: "tool_execution_end", toolCallId: id, toolName: tool, isError: false, result: { content: [] } })];
  const runs = {
    A: [...event("1", "bash", { command: "python3 -m venv /tmp/fixture_venv && /tmp/fixture_venv/bin/pip install x" }), ...event("2", "write", { path: "/tmp/fixture.mjs", content: "x" })],
    B: [...event("1", "bash", { command: "/tmp/fixture_venv/bin/python run.py; cat /tmp/fixture.mjs" })],
    C: [...event("1", "bash", { command: "cd /tmp && ls" }), ...event("2", "read", { path: "/tmp/pi-orche/private/file" })],
  };
  const starts = { A: "2026-01-01T00:00:00Z", B: "2026-01-01T00:00:30Z", C: "2026-01-01T01:00:00Z" };
  const records = [];
  for (const [id, lines] of Object.entries(runs)) {
    mkdirSync(join(root, "runs", id), { recursive: true });
    writeFileSync(join(root, "runs", id, "events.jsonl"), lines.join("\n") + "\n");
    records.push({ runId: id, task: "T", config: "current", rep: 1, model: { id: "m", thinking: "high" }, startedAt: starts[id], wallSeconds: 60, grade: { checks: { acceptance: true } }, usage: { costListPrice: 0 } });
  }
  writeFileSync(join(root, "runs.jsonl"), records.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const result = spawnSync("python3", [join(here, "trace_shared_tmp.py"), root, join(root, "runs.jsonl")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const trace = JSON.parse(result.stdout);
  assert.deepEqual(trace.runsNamingHostTmp, ["A", "B"]);
  assert.deepEqual(trace.runsSharingAResourceWithAnotherRun, ["A", "B"]);
  // exec counts as a possible writer (an interpreter run from a shared venv can change it), so concurrent A and B both qualify.
  assert.deepEqual(trace.runsWithPossibleEarlierOrConcurrentWriter, ["A", "B"]);
  assert.deepEqual(trace.runsConcurrentWithAnotherUser, ["A", "B"]);
  assert.deepEqual(Object.keys(trace.runsWithUnresolvedTmpUse), ["C"]);
  const venv = trace.resources.find((r) => r.resource === "/tmp/fixture_venv");
  assert.deepEqual(venv.entries.map((e) => [e.runId, e.firstKind]), [["A", "write"], ["B", "exec"]]);
});

test("sandbox boundary: private /tmp, read-only host, hidden graders and other runs, provider config readable", { skip: spawnSync("bwrap", ["--version"]).status !== 0 && "bwrap not available" }, async () => {
  const { DEFAULT_ISOLATION, sandboxArgs } = await import("./sandbox.mjs");
  const runs = join(scratch, "sandbox", "runs");
  const own = join(runs, "own");
  const other = join(runs, "other");
  mkdirSync(join(own, "work"), { recursive: true });
  mkdirSync(other, { recursive: true });
  writeFileSync(join(other, "secret.txt"), "other run");
  const marker = `policy-pilot-probe-${process.pid}-${Date.now()}`;
  const graders = join(pilot, "tasks", "T1-csv-export", "hidden", "acceptance.test.mjs");
  const probe = [
    `test -e "${graders}" && echo graders-visible || echo graders-hidden`,
    `cat "${join(other, "secret.txt")}" 2>/dev/null || echo other-run-hidden`,
    `echo x > /tmp/${marker} && echo tmp-write-ok`,
    `touch "${join(pilot, "README.md")}" 2>/dev/null && echo repo-writable || echo repo-not-writable`,
    `touch "$REAL_HOME/${marker}" 2>/dev/null && echo home-writable || echo home-not-writable`,
    `echo y > "${join(own, "work", "out.txt")}" && echo own-write-ok`,
    `test -r "$REAL_HOME/.pi/agent/cliproxyapi.json" && echo provider-config-readable`,
    `test -e "$REAL_HOME/.pi/agent/sessions" && echo sessions-visible || echo sessions-hidden`,
    `pi --version >/dev/null 2>&1 && echo pi-runs`,
  ].join("; ");
  const result = spawnSync("bwrap", [...sandboxArgs(DEFAULT_ISOLATION, own, join(own, "work")), "sh", "-c", probe], { encoding: "utf8", env: { ...process.env, REAL_HOME: homedir() } });
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trim().split("\n");
  for (const expected of ["graders-hidden", "other-run-hidden", "tmp-write-ok", "repo-not-writable", "home-not-writable", "own-write-ok", "provider-config-readable", "pi-runs"]) assert.ok(lines.includes(expected), `${expected}: ${result.stdout}`);
  assert.ok(lines.includes("sessions-hidden") || !existsSync(join(homedir(), ".pi/agent/sessions")), result.stdout);
  assert.equal(existsSync(join("/tmp", marker)), false, "a write to /tmp inside the sandbox must not reach the host /tmp");
  assert.equal(readFileSync(join(own, "work", "out.txt"), "utf8"), "y\n");
});
