// Model-free checks of the follow-up pilot: graders (start rejected, reference accepted, representative partial fixes
// rejected), generated fixtures reproducible, clean variants with recorded hashes, plans reproducible, and the
// sandbox2 boundary including the installed ast-grep. Run: node --test experiments/policy-pilot-2/harness/self_check2.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pilot = resolve(here, "..");
const repoRoot = resolve(pilot, "..", "..");
const scratch = mkdtempSync(join(tmpdir(), "policy-pilot-2-check-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const { NODE_TEST_CONTEXT, ...cleanEnv } = process.env;
const TASKS = ["A-ledger-min-amount", "B-logger-migration", "C-msa-capability", "D-probe-retries"];

function grade(task, repo) {
  const dir = join(pilot, "tasks", task);
  const env = { ...cleanEnv, TASK_REPO: repo, TASK_ORIGINAL: join(dir, "repo"), TMPDIR: scratch, PYTHONDONTWRITEBYTECODE: "1" };
  if (existsSync(join(dir, "hidden/grade.py"))) {
    const result = spawnSync("python3", [join(dir, "hidden/grade.py"), repo], { env, encoding: "utf8" });
    return JSON.parse(result.stdout).checks;
  }
  const result = spawnSync("node", ["--test", "--test-reporter=tap", join(dir, "hidden/acceptance.test.mjs")], { env, encoding: "utf8" });
  return { acceptance: result.status === 0, failed: [...result.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]) };
}

function solved(task, name) {
  const target = join(scratch, `${task}-${name}`);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(pilot, "tasks", task, "repo"), target, { recursive: true });
  const applied = spawnSync("git", ["apply", join(pilot, "tasks", task, "reference.diff")], { cwd: target, encoding: "utf8" });
  assert.equal(applied.status, 0, applied.stderr);
  return target;
}

function edit(root, file, from, to) {
  const path = join(root, file);
  const text = readFileSync(path, "utf8");
  assert.ok(text.includes(from), `${file}: ${from}`);
  writeFileSync(path, text.replace(from, to));
}

for (const task of TASKS) {
  test(`${task}: grader rejects the start and accepts the reference`, () => {
    const start = join(scratch, `${task}-start`);
    cpSync(join(pilot, "tasks", task, "repo"), start, { recursive: true });
    assert.equal(grade(task, start).acceptance, false);
    assert.equal(grade(task, solved(task, "reference")).acceptance, true);
  });
}

test("A: a threshold parsed without the file's locale is rejected", () => {
  const root = solved("A-ledger-min-amount", "partial-parsefloat");
  edit(root, "src/export.js", "const threshold = parseAmount(minAmount, { locale: ledger.locale });", "const threshold = Math.round(parseFloat(String(minAmount).replace(/[^0-9.-]/g, \"\")) * 100);\n    if (Number.isNaN(threshold)) throw new RangeError(\"invalid\");");
  const checks = grade("A-ledger-min-amount", root);
  assert.equal(checks.acceptance, false);
  assert.ok(checks.failed.some((name) => name.includes("locale")), checks.failed.join("; "));
});

test("D: each single-cause fix and a naive comment strip are rejected", () => {
  const onlyDefault = join(scratch, "D-only-default");
  cpSync(join(pilot, "tasks/D-probe-retries/repo"), onlyDefault, { recursive: true });
  edit(onlyDefault, "src/probe.js", "retries: retries || DEFAULTS.retries", "retries");
  assert.equal(grade("D-probe-retries", onlyDefault).acceptance, false);
  const onlyComments = solved("D-probe-retries", "only-comments");
  edit(onlyComments, "src/probe.js", "return { ...settings, retries, timeout_ms: timeout };", "return { ...settings, retries: retries || DEFAULTS.retries, timeout_ms: timeout };");
  assert.equal(grade("D-probe-retries", onlyComments).acceptance, false);
  const naive = join(scratch, "D-naive");
  cpSync(join(pilot, "tasks/D-probe-retries/repo"), naive, { recursive: true });
  edit(naive, "src/probe.js", "retries: retries || DEFAULTS.retries", "retries");
  edit(naive, "src/config.js", "config[match[1]] = parseValue(match[2]);", "config[match[1]] = parseValue(match[2].split(\"#\")[0]);");
  const checks = grade("D-probe-retries", naive);
  assert.equal(checks.acceptance, false);
  assert.ok(checks.failed.some((name) => name.includes("reported command")), checks.failed.join("; "));
});

test("B: a textual replace-all that also rewrites shadowed log calls is rejected", () => {
  const root = join(scratch, "B-regex");
  cpSync(join(pilot, "tasks/B-logger-migration/repo"), root, { recursive: true });
  for (const folder of ["services", "jobs"]) {
    for (const name of readdirSync(join(root, "src", folder))) {
      const path = join(root, "src", folder, name);
      const text = readFileSync(path, "utf8")
        .replace(/\b(?:log|record|write|trace|logging\.log)\("(debug|info|warn|error)",\s*/g, (_, level) => `logger.${level}(`)
        .replace(/\b(?:log|record|write|trace|logging\.log)\(level,\s*/g, "logger[level](")
        .replace(/import \{ (LEVELS, )?log(?: as \w+)? \} from "\.\.\/log\.js";/, 'import { $1logger } from "../log.js";')
        .replace(/import \* as logging from "\.\.\/log\.js";/, 'import { logger } from "../log.js";');
      writeFileSync(path, text);
    }
  }
  const checks = grade("B-logger-migration", root);
  assert.equal(checks.acceptance, false);
  assert.ok(checks.failed.some((name) => name.includes("untouched")), JSON.stringify(checks));
});

test("C: valid numbers with a 'capable, proceed' conclusion are rejected; the strict MS judgment is scored separately", () => {
  const root = solved("C-msa-capability", "proceed");
  const results = JSON.parse(readFileSync(join(root, "results.json"), "utf8"));
  writeFileSync(join(root, "results.json"), JSON.stringify({ ...results, capability_valid: true, recommendation: "proceed_to_analyze", ms_adequate_for_capability: true }));
  const checks = grade("C-msa-capability", root);
  assert.equal(checks.acceptance, false);
  assert.equal(checks.grr_numbers, true);
  assert.equal(checks.ms_judgment_strict, false);
  const lenient = solved("C-msa-capability", "special-causes-only");
  const answer = JSON.parse(readFileSync(join(lenient, "results.json"), "utf8"));
  writeFileSync(join(lenient, "results.json"), JSON.stringify({ ...answer, ms_adequate_for_capability: true, recommendation: "address_special_causes_first" }));
  const lenientChecks = grade("C-msa-capability", lenient);
  assert.equal(lenientChecks.acceptance, true);
  assert.equal(lenientChecks.ms_judgment_strict, false);
});

test("generated fixtures (B, C) are reproduced by their generators", () => {
  const b = join(scratch, "genB");
  assert.equal(spawnSync("python3", [join(pilot, "tasks/B-logger-migration/generate.py"), b], { encoding: "utf8" }).status, 0);
  const diffB = spawnSync("diff", ["-r", join(b, "repo"), join(pilot, "tasks/B-logger-migration/repo")], { encoding: "utf8" });
  assert.equal(diffB.status, 0, diffB.stdout.slice(0, 500));
  assert.equal(readFileSync(join(b, "preserved.json"), "utf8"), readFileSync(join(pilot, "tasks/B-logger-migration/hidden/preserved.json"), "utf8"));
  const c = join(scratch, "genC");
  mkdirSync(c);
  assert.equal(spawnSync("python3", [join(pilot, "tasks/C-msa-capability/generate.py"), c], { encoding: "utf8", env: { ...cleanEnv, PYTHONDONTWRITEBYTECODE: "1" } }).status, 0);
  const diffC = spawnSync("diff", ["-r", join(c, "data"), join(pilot, "tasks/C-msa-capability/repo/data")], { encoding: "utf8" });
  assert.equal(diffC.status, 0, diffC.stdout.slice(0, 500));
});

test("variants: rebuilt from 44aeb2d with the recorded hashes and diffs, and contain no experiment, test or grader files", () => {
  const snapshot = join(scratch, "snapshot");
  mkdirSync(snapshot);
  assert.equal(spawnSync("sh", ["-c", `git -C "${repoRoot}" archive 44aeb2d | tar -x -C "${snapshot}"`]).status, 0);
  const out = join(scratch, "variants");
  const built = spawnSync("python3", [join(here, "make_variants2.py"), snapshot, out], { encoding: "utf8", env: { ...cleanEnv, PYTHONDONTWRITEBYTECODE: "1" } });
  assert.equal(built.status, 0, built.stderr);
  const hashes = JSON.parse(readFileSync(join(out, "hashes.json"), "utf8"));
  assert.deepEqual(hashes, JSON.parse(readFileSync(join(pilot, "variants/hashes.json"), "utf8")));
  for (const name of Object.keys(hashes)) {
    assert.equal(readFileSync(join(out, `${name}.diff`), "utf8"), readFileSync(join(pilot, "variants", `${name}.diff`), "utf8"), name);
    const listing = spawnSync("find", [".", "-mindepth", "1"], { cwd: join(out, name), encoding: "utf8" }).stdout.split("\n").filter(Boolean).map((p) => p.slice(2));
    const leaked = listing.filter((p) => /^(experiments|tests|scripts|patches|\.git)(\/|$)|(^|\/)(hidden|\.git)(\/|$)|reference\.diff$|acceptance\.test\.mjs$|grade\.py$/.test(p));
    assert.deepEqual(leaked, [], name);
  }
});

test("plans regenerate with the recorded runs, configurations, limits and hashes", () => {
  for (const stage of ["calibration", "main", "haiku"]) {
    const recordedPath = join(pilot, "results", `plan-${stage}.json`);
    if (!existsSync(recordedPath)) continue;
    const target = join(scratch, `plan-${stage}.json`);
    const made = spawnSync("node", [join(here, "make_plan2.mjs"), join(pilot, "variants"), target, stage], { encoding: "utf8" });
    assert.equal(made.status, 0, made.stderr);
    const fresh = JSON.parse(readFileSync(target, "utf8"));
    const recorded = JSON.parse(readFileSync(recordedPath, "utf8"));
    for (const key of ["runs", "configs", "limits", "tasks", "variantHashes", "isolation"]) assert.deepEqual(fresh[key], recorded[key], `${stage}.${key}`);
    if (stage !== "calibration") assert.deepEqual(fresh.taskHashes, recorded.taskHashes, `${stage}.taskHashes`);
  }
});

test("sandbox2: real HOME, repositories, graders and other runs hidden; private /tmp; ast-grep, pi, node, python and git work", { skip: spawnSync("bwrap", ["--version"]).status !== 0 && "bwrap not available" }, async () => {
  const { ISOLATION, sandboxArgs, sandboxPath } = await import("./sandbox2.mjs");
  const toolbin = join(scratch, "toolbin");
  mkdirSync(toolbin);
  const astGrep = spawnSync("sh", ["-c", "command -v ast-grep || true"], { encoding: "utf8" }).stdout.trim() || process.env.PILOT_AST_GREP;
  if (!astGrep) return;
  cpSync(astGrep, join(toolbin, "ast-grep"));
  const own = join(scratch, "runs", "own");
  const other = join(scratch, "runs", "other");
  mkdirSync(join(own, "work"), { recursive: true });
  mkdirSync(other, { recursive: true });
  writeFileSync(join(other, "secret.txt"), "other run");
  cpSync(join(pilot, "tasks/B-logger-migration/repo"), join(own, "work/p"), { recursive: true });
  const marker = `policy-pilot-2-probe-${process.pid}`;
  const real = homedir();
  const probe = [
    `test -e "${join(pilot, "tasks/B-logger-migration/hidden/acceptance.test.mjs")}" && echo graders-visible || echo graders-hidden`,
    `test -e "${join(real, "Code")}" && echo code-visible || echo code-hidden`,
    `test -e "${join(real, ".ssh")}" -o -e "${join(real, ".config")}" -o -e "${join(real, ".gitconfig")}" && echo home-visible || echo home-hidden`,
    `test -e "${join(real, ".pi/agent/sessions")}" && echo sessions-visible || echo sessions-hidden`,
    `cat "${join(other, "secret.txt")}" 2>/dev/null || echo other-run-hidden`,
    `echo x > /tmp/${marker} && echo tmp-write-ok`,
    `touch "${join(real, marker)}" 2>/dev/null; echo home-write-attempted`,
    `test -r "${join(real, ".pi/agent/cliproxyapi.json")}" && echo provider-config-readable`,
    `ast-grep --version`,
    `ast-grep run -p 'log($$$A)' -l js src | grep -c 'log(' `,
    `pi --version`, `node --version`, `python3 --version`, `git --version`,
  ].join("; ");
  const result = spawnSync("bwrap", [...sandboxArgs(ISOLATION, own, join(own, "work/p"), toolbin), "sh", "-c", probe], { encoding: "utf8", env: { PATH: sandboxPath(toolbin), HOME: own } });
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trim().split("\n");
  for (const expected of ["graders-hidden", "code-hidden", "home-hidden", "sessions-hidden", "other-run-hidden", "tmp-write-ok", "home-write-attempted", "provider-config-readable", "1.1.0"]) {
    assert.ok(lines.includes(expected), `${expected}: ${result.stdout}`);
  }
  assert.ok(lines.some((l) => /^ast-grep \d/.test(l)) && lines.some((l) => /^v24\./.test(l)) && lines.some((l) => /^Python 3/.test(l)) && lines.some((l) => /^git version/.test(l)), result.stdout);
  assert.ok(Number(lines.find((l) => /^\d+$/.test(l))) >= 60, "ast-grep finds the fixture's log calls");
  assert.equal(existsSync(join("/tmp", marker)), false, "a /tmp write inside must not reach the host /tmp");
  assert.equal(existsSync(join(real, marker)), false, "a HOME write inside lands in the tmpfs, not the real HOME");
});

test("records: every planned main/haiku run recorded once, inside the v2 boundary, with an opaque run directory; summary.md regenerates", () => {
  const ledger = (name) => readFileSync(join(pilot, "results", name), "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  for (const stage of ["main", "haiku"]) {
    const plan = JSON.parse(readFileSync(join(pilot, "results", `plan-${stage}.json`), "utf8"));
    const runs = ledger(`runs-${stage}.jsonl`);
    assert.deepEqual(runs.map((r) => r.runId).sort(), plan.runs.map((r) => r.runId).sort(), stage);
    for (const run of runs) {
      assert.equal(run.isolation?.version, 2, run.runId);
      assert.ok(/^[0-9a-f]{16}$/.test(run.runDir) && !run.runDir.includes(run.config), run.runId);
      assert.deepEqual(run.modelsSeen, [`${run.model.id}:${run.model.thinking}`], run.runId);
    }
  }
  const files = (names) => names.map((n) => join(pilot, "results", n)).join(",");
  const summary = spawnSync("python3", [join(here, "analyze2.py"), files(["runs-main.jsonl", "runs-haiku.jsonl"]), files(["plan-main.json", "plan-haiku.json"])], { encoding: "utf8" });
  assert.equal(summary.status, 0, summary.stderr);
  assert.equal(summary.stdout, readFileSync(join(pilot, "results", "summary.md"), "utf8"));
});
