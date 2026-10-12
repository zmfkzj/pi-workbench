// Follow-up pilot runner: real Pi sessions (print mode, JSON events) for a fixed plan, every one inside the
// sandbox2.mjs boundary, then hidden grading of the final repository.
//
// node run2.mjs --plan plan.json --variants <dir> --scratch <dir> --out <dir> --tools <dir with ast-grep> [--only id,...] [--concurrency n]
//
// Per run: fresh agent dir (no packages in settings; provider config linked, model catalog copied), fresh HOME/TMPDIR/
// npm/pip caches, a git-initialised copy of the task repository, and (unless the configuration is "off") a copy of the
// configuration's Workbench package. Pi discovery is disabled except the provider extension and the copied Workbench
// extension and routing skills. Cost: every run reserves its per-run cap while it is in flight, so a new run starts only
// when committed cost + in-flight reservations + its own cap stay within the plan's total cap. A single response can
// still exceed a per-run cap before the run is stopped; that overshoot is recorded.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sandboxArgs, sandboxPath } from "./sandbox2.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, i, all) => (value.startsWith("--") ? [...pairs, [value.slice(2), all[i + 1]]] : pairs), []));
const plan = JSON.parse(readFileSync(resolve(args.plan), "utf8"));
const variants = resolve(args.variants);
const scratch = resolve(args.scratch);
const out = resolve(args.out);
const tools = args.tools ? resolve(args.tools) : null;
const tasksDir = resolve(here, "..", "tasks");
const concurrency = Number(args.concurrency ?? plan.limits.concurrency);
const only = args.only ? new Set(args.only.split(",")) : null;
const AGENT = join(homedir(), ".pi", "agent");
const PROVIDER_EXTENSION = join(AGENT, "npm/node_modules/@router-for-me/pi-cliproxyapi-provider/extensions/index.ts");
mkdirSync(out, { recursive: true });
const ledger = join(out, "runs.jsonl");
const records = () => (existsSync(ledger) ? readFileSync(ledger, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const done = new Set(records().map((r) => r.runId));
const committed = () => records().reduce((n, r) => n + (r.usage?.costListPrice ?? 0), 0);
let inFlight = 0;

const git = (cwd, ...gitArgs) => spawnSync("git", ["-c", "user.name=pilot", "-c", "user.email=pilot@localhost", "-c", "commit.gpgsign=false", ...gitArgs], { cwd, encoding: "utf8" });
const sha = (text) => createHash("sha256").update(text).digest("hex");

// Run directories are opaque (hash of the run ID): the working directory the model sees does not name the configuration.
const runDir = (run) => sha(`policy-pilot-2:${run.runId}`).slice(0, 16);

function prepare(run) {
  const dir = join(scratch, "runs", runDir(run));
  rmSync(dir, { recursive: true, force: true });
  for (const sub of ["agent", "work", "home", "tmp", "session"]) mkdirSync(join(dir, sub), { recursive: true });
  writeFileSync(join(dir, "agent/settings.json"), JSON.stringify({ defaultProvider: "cliproxyapi", quietStartup: true, compaction: { enabled: false } }));
  symlinkSync(join(AGENT, "cliproxyapi.json"), join(dir, "agent/cliproxyapi.json"));
  for (const file of ["cliproxyapi-models.json", "models.json"]) cpSync(join(AGENT, file), join(dir, "agent", file));
  const work = join(dir, "work", "project");
  cpSync(join(tasksDir, run.task, "repo"), work, { recursive: true });
  git(work, "init", "-q");
  git(work, "add", "-A");
  git(work, "commit", "-qm", "task start");
  const config = plan.configs[run.config];
  let pkg = null;
  if (config.variant) {
    pkg = join(dir, "pkg", "pi-workbench");
    cpSync(join(variants, config.variant), pkg, { recursive: true });
  }
  return { dir, work, pkg };
}

function command(run, { dir, pkg }) {
  const config = plan.configs[run.config];
  const flags = ["-p", "--mode", "json", "--session-dir", join(dir, "session"), "--no-extensions", "-e", PROVIDER_EXTENSION];
  if (pkg) flags.push("-e", join(pkg, "index.js"));
  flags.push("--no-skills");
  if (pkg) flags.push("--skill", join(pkg, "skills"));
  flags.push("--no-context-files", "--no-prompt-templates", "--no-themes", "--no-mcp", "--tools", plan.tools.join(","), "--model", run.model.id, "--thinking", run.model.thinking);
  const prompt = readFileSync(join(tasksDir, run.task, "prompt.md"), "utf8").trim();
  return [...flags, ...(config.commands ?? []), ...(config.select ?? []).map((id) => `/workbench skill ${id}`), prompt];
}

function environment({ dir }) {
  const home = join(dir, "home");
  return {
    PATH: sandboxPath(tools), LANG: "C.UTF-8", TERM: "dumb", HOME: home, TMPDIR: join(dir, "tmp"),
    PI_CODING_AGENT_DIR: join(dir, "agent"), PI_OFFLINE: "1", PI_TELEMETRY: "0",
    NPM_CONFIG_PREFIX: join(home, ".npm-global"), npm_config_cache: join(home, ".npm"), PIP_CACHE_DIR: join(home, ".pip"),
    PYTHONUSERBASE: join(home, ".local"), CARGO_HOME: join(home, ".cargo"), BUN_INSTALL: join(home, ".bun"), UV_CACHE_DIR: join(home, ".uv"),
    PYTHONDONTWRITEBYTECODE: "1",
  };
}

/** Injected skill text for explicit selections: the SKILL.md files the runtime attaches, with their hashes. */
function injected(run, pkg) {
  const config = plan.configs[run.config];
  if (!pkg || !config.select?.length) return [];
  const catalog = JSON.parse(readFileSync(join(pkg, "catalog.json"), "utf8"));
  return config.select.map((id) => {
    const skill = catalog.skills.find((s) => s.id === id);
    const text = readFileSync(join(pkg, skill.path), "utf8");
    return { id, path: skill.path, sha256: sha(text), bytes: Buffer.byteLength(text) };
  });
}

const EDIT_BASH = /(\bsed\s+-i|\bperl\s+-[a-z]*i|>\s*[\w./-]+\.(js|mjs|json|md|py|conf)\b|\btee\s|\bmv\s|\bcp\s|writeFileSync|\.write_text\(|open\([^)]*["']w)/;

function summarise(events, pkg) {
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costListPrice: 0, assistantMessages: 0 };
  const calls = new Map();
  const order = [];
  const models = new Set();
  const retries = [];
  let finalText = "";
  let stopReason = null;
  let errorMessage = null;
  let settled = false;
  for (const event of events) {
    if (event.type === "auto_retry_start") retries.push(event.errorMessage);
    if (event.type === "agent_settled") settled = true;
    if (event.type === "tool_execution_start") {
      const call = { index: order.length, id: event.toolCallId, name: event.toolName, args: event.args ?? {}, isError: null, output: "" };
      calls.set(event.toolCallId, call);
      order.push(call);
    }
    if (event.type === "tool_execution_end") {
      const call = calls.get(event.toolCallId);
      if (call) {
        call.isError = Boolean(event.isError);
        call.output = (event.result?.content ?? []).map((p) => p.text ?? "").join("");
      }
    }
    if (event.type === "message_end" && event.message?.role === "assistant") {
      const m = event.message;
      usage.assistantMessages++;
      for (const key of ["input", "output", "cacheRead", "cacheWrite", "reasoning"]) usage[key] += m.usage?.[key] ?? 0;
      usage.costListPrice += m.usage?.cost?.total ?? 0;
      models.add(`${m.provider}/${m.model}:${m.thinkingLevel ?? "?"}`);
      stopReason = m.stopReason;
      if (m.errorMessage) errorMessage = m.errorMessage;
      const text = (m.content ?? []).filter((p) => p.type === "text").map((p) => p.text).join("");
      if (text.trim()) finalText = text;
    }
  }
  // Workbench files opened: successful read tool calls, and successful shell reads (cat/sed/head/tail/less/awk) naming the file.
  const opened = new Map();
  const rel = (path) => {
    const p = String(path);
    const m = /pi-workbench\/((?:skills|vendor|docs)\/\S+?\.md)\b/.exec(p);
    return m ? m[1] : /^(skills|vendor|docs)\/\S+\.md$/.test(p) ? p : null;
  };
  for (const call of order) {
    if (call.isError !== false) continue;
    if (call.name === "read") {
      const r = rel(call.args.path);
      if (r) opened.set(r, (opened.get(r) ?? []).concat({ via: "read", call: call.index, offset: call.args.offset ?? null, limit: call.args.limit ?? null }));
    } else if (call.name === "bash" && /\b(cat|sed|head|tail|less|awk|bat)\b/.test(String(call.args.command))) {
      for (const m of String(call.args.command).matchAll(/pi-workbench\/((?:skills|vendor|docs)\/[^\s"'`;|&)]+?\.md)/g)) {
        opened.set(m[1], (opened.get(m[1]) ?? []).concat({ via: "bash", call: call.index }));
      }
    }
  }
  return { usage, order, models: [...models], finalText, stopReason, errorMessage, settled, retries, opened: Object.fromEntries([...opened].sort()) };
}

function behaviour(task, order, finalText) {
  const spec = plan.tasks[task];
  const isEdit = (c) => ["edit", "write"].includes(c.name) || (c.name === "bash" && EDIT_BASH.test(String(c.args.command ?? "")));
  const lastEdit = order.reduce((n, c) => (isEdit(c) ? c.index : n), -1);
  const bash = order.filter((c) => c.name === "bash");
  // A command that edits and then verifies (`...; node --test`) counts as verification after the last edit.
  const after = bash.filter((c) => c.index >= lastEdit);
  const verify = Object.fromEntries(Object.entries(spec.verify).map(([name, pattern]) => {
    const re = new RegExp(pattern);
    const runs = after.filter((c) => re.test(String(c.args.command ?? "")));
    return [name, { afterLastEdit: runs.length, lastSucceeded: runs.length ? runs.at(-1).isError === false : null }];
  }));
  const commands = bash.map((c) => String(c.args.command ?? ""));
  return {
    toolCalls: order.length,
    toolErrors: order.filter((c) => c.isError).length,
    edits: order.filter(isEdit).length,
    lastEditCall: lastEdit,
    verify,
    astGrepCalls: commands.filter((c) => /(^|[\s;&|(])(ast-grep|sg)\s/.test(c)).length,
    astGrepSucceeded: bash.filter((c) => /(^|[\s;&|(])(ast-grep|sg)\s/.test(String(c.args.command)) && c.isError === false).length,
    installAttempts: commands.filter((c) => /\b(npm|pnpm|yarn|bun) (i|install|add)\b|\bnpx\s|pip3? install|cargo install|apt(-get)? install|uv (tool|pip) install/.test(c)),
    claimsSuccess: /(통과|성공|해결(했|됨|되었)|고쳤|완료|수정했|fixed|resolved|all tests pass|passing)/i.test(finalText),
  };
}

function grade(run, { work, dir }) {
  const task = join(tasksDir, run.task);
  const { NODE_TEST_CONTEXT, ...base } = process.env;
  const env = { ...base, TMPDIR: join(dir, "tmp"), TASK_REPO: work, TASK_ORIGINAL: join(task, "repo"), PYTHONDONTWRITEBYTECODE: "1" };
  const result = { checks: {} };
  if (existsSync(join(task, "hidden/acceptance.test.mjs"))) {
    const test = spawnSync("node", ["--test", "--test-reporter=tap", join(task, "hidden/acceptance.test.mjs")], { env, encoding: "utf8", timeout: 180000 });
    for (const match of test.stdout.matchAll(/^(not ok|ok) \d+ - (.+)$/gm)) result.checks[match[2]] = match[1] === "ok";
    result.checks.acceptance = test.status === 0 && Object.keys(result.checks).length > 0;
  }
  if (existsSync(join(task, "hidden/grade.py"))) {
    const graded = spawnSync("python3", [join(task, "hidden/grade.py"), work], { env, encoding: "utf8", timeout: 180000 });
    try { Object.assign(result, JSON.parse(graded.stdout)); } catch { result.checks.acceptance = false; result.error = graded.stderr.slice(-500); }
  }
  git(work, "add", "-A");
  const stat = git(work, "diff", "--cached", "--numstat", "HEAD").stdout.trim().split("\n").filter(Boolean).map((l) => l.split("\t"));
  const allowed = plan.tasks[run.task].allowed.map((p) => new RegExp(p));
  const files = stat.map(([a, d, f]) => ({ file: f, added: Number(a) || 0, deleted: Number(d) || 0, allowed: allowed.some((re) => re.test(f)) }));
  result.diff = { files, added: files.reduce((n, f) => n + f.added, 0), deleted: files.reduce((n, f) => n + f.deleted, 0),
    outsideAllowed: files.filter((f) => !f.allowed).map((f) => f.file) };
  const diffText = git(work, "diff", "--cached", "HEAD").stdout;
  writeFileSync(join(dir, "final.diff"), diffText);
  result.diff.text = diffText.length > 40000 ? `${diffText.slice(0, 40000)}\n[truncated ${diffText.length - 40000} chars]` : diffText;
  return result;
}

async function execute(run) {
  const started = Date.now();
  const base = { runId: run.runId, runDir: runDir(run), stage: plan.stage, task: run.task, taskHash: plan.taskHashes?.[run.task] ?? null, config: run.config, rep: run.rep, order: run.order,
    model: run.model, variant: plan.configs[run.config].variant, variantHash: plan.variantHashes?.[plan.configs[run.config].variant] ?? null, isolation: plan.isolation };
  let paths;
  try {
    paths = prepare(run);
  } catch (error) {
    appendFileSync(ledger, JSON.stringify({ ...base, startedAt: new Date(started).toISOString(), harnessError: `prepare: ${error.message}`, usage: { costListPrice: 0 } }) + "\n");
    console.log(`${run.runId} harness error (prepare): ${error.message}`);
    return;
  }
  const child = spawn("bwrap", [...sandboxArgs(plan.isolation, paths.dir, paths.work, tools), "pi", ...command(run, paths)], { cwd: paths.work, env: environment(paths), stdio: ["ignore", "pipe", "pipe"] });
  const events = [];
  let buffer = "";
  let stderr = "";
  let killed = null;
  let toolCount = 0;
  let cost = 0;
  const stop = (reason) => { if (!killed) { killed = reason; child.kill("SIGTERM"); /** @type {any} */ (setTimeout(() => child.kill("SIGKILL"), 5000)).unref?.(); } };
  const timer = setTimeout(() => stop("timeout"), plan.limits.runTimeoutSeconds * 1000);
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (!line.trim()) continue;
      let event;
      try { event = JSON.parse(line); } catch { appendFileSync(join(paths.dir, "events.jsonl"), line + "\n"); continue; }
      // Streaming deltas are cumulative and large; the final message_end carries the same content.
      if (event.type === "message_update") continue;
      appendFileSync(join(paths.dir, "events.jsonl"), line + "\n");
      events.push(event);
      if (event.type === "message_end" && event.message?.role === "assistant") {
        cost += event.message.usage?.cost?.total ?? 0;
        toolCount += (event.message.content ?? []).filter((p) => p.type === "toolCall").length;
        if (toolCount > plan.limits.maxToolCalls) stop("tool-cap");
        if (cost > plan.limits.runCostCapListPrice) stop("cost-cap");
      }
    }
  });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exitCode = await new Promise((resolveExit) => {
    child.on("error", (error) => { stderr += `spawn error: ${error.message}`; resolveExit("spawn-error"); });
    child.on("close", (code, signal) => resolveExit(code ?? signal));
  });
  clearTimeout(timer);
  const wallSeconds = (Date.now() - started) / 1000;
  const summary = summarise(events, paths.pkg);
  const graded = grade(run, paths);
  const record = {
    ...base, startedAt: new Date(started).toISOString(), wallSeconds, exitCode, killed, stopReason: summary.stopReason, errorMessage: summary.errorMessage,
    settled: summary.settled, retries: summary.retries, stderrTail: stderr.slice(-400), modelsSeen: summary.models, usage: summary.usage,
    overCap: summary.usage.costListPrice > plan.limits.runCostCapListPrice,
    exposure: { opened: summary.opened, injected: injected(run, paths.pkg), profileCommands: plan.configs[run.config].commands ?? [] },
    behaviour: behaviour(run.task, summary.order, summary.finalText), grade: graded, finalText: summary.finalText.slice(0, 6000),
    toolLog: summary.order.map((c) => ({ index: c.index, name: c.name, isError: c.isError,
      args: c.name === "write" ? { path: c.args.path, chars: String(c.args.content ?? "").length } : c.name === "edit" ? { path: c.args.path, edits: c.args.edits?.length } : c.args,
      outputChars: c.output.length, outputTail: c.name === "bash" ? c.output.slice(-600) : undefined })),
  };
  appendFileSync(ledger, JSON.stringify(record) + "\n");
  // Keep events.jsonl, final.diff and the final repository; drop the package copy, caches and the duplicate session file.
  for (const sub of ["pkg", "tmp", "session", "agent", "home"]) rmSync(join(paths.dir, sub), { recursive: true, force: true });
  console.log(`${run.runId} exit=${exitCode}${killed ? ` killed=${killed}` : ""} accept=${graded.checks.acceptance} tools=${record.behaviour.toolCalls} cost=$${summary.usage.costListPrice.toFixed(3)} wall=${wallSeconds.toFixed(0)}s opened=${Object.keys(summary.opened).length}`);
}

const queue = plan.runs.filter((run) => !done.has(run.runId) && (!only || only.has(run.runId)));
console.log(`${queue.length} runs queued (${done.size} recorded); committed $${committed().toFixed(2)} list price; cap $${plan.limits.totalCostCapListPrice}`);
let capped = false;
async function worker() {
  while (queue.length) {
    if (committed() + (inFlight + 1) * plan.limits.runCostCapListPrice > plan.limits.totalCostCapListPrice) {
      if (inFlight > 0) { await new Promise((r) => setTimeout(r, 5000)); continue; }
      if (!capped) console.log(`total cost cap: committed $${committed().toFixed(2)} + reservation would exceed $${plan.limits.totalCostCapListPrice}; ${queue.length} runs not started`);
      capped = true;
      return;
    }
    const run = queue.shift();
    inFlight++;
    try { await execute(run); } finally { inFlight--; }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
