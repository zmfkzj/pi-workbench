// Policy pilot runner: runs real Pi sessions (print mode, JSON events) for a fixed matrix of task × configuration ×
// repetition in isolated scratch directories, then grades each final repository with the task's hidden checks.
//
// node run.mjs --plan plan.json --variants <dir from make_variants.py> --scratch <dir> --out <results dir>
//               [--only <runId,...>] [--concurrency 4]
//
// Isolation per run: fresh agent dir (settings without packages, the provider config linked, model catalog copied),
// fresh HOME/TMPDIR/npm/pip/cargo prefixes, a fresh copy of the task repository and of the configuration's package,
// a minimal environment (no PI_* variables of the calling session), and explicit Pi flags: no extension/skill/context/
// prompt/theme/MCP discovery; only the provider extension and, unless the configuration is "off", the copied
// Workbench extension and its routing skills. Credentials are never printed or copied into results.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, i, all) => (value.startsWith("--") ? [...pairs, [value.slice(2), all[i + 1]]] : pairs), []));
const plan = JSON.parse(readFileSync(resolve(args.plan), "utf8"));
const variants = resolve(args.variants);
const scratch = resolve(args.scratch);
const out = resolve(args.out);
const tasksDir = resolve(here, "..", "tasks");
const concurrency = Number(args.concurrency ?? plan.limits.concurrency);
const only = args.only ? new Set(args.only.split(",")) : null;
const AGENT = join(homedir(), ".pi", "agent");
const PROVIDER_EXTENSION = join(AGENT, "npm/node_modules/@router-for-me/pi-cliproxyapi-provider/extensions/index.ts");
const PYTHON_PATH = process.env.PILOT_PYTHONPATH ?? "";
mkdirSync(out, { recursive: true });
const ledger = join(out, "runs.jsonl");
const done = new Set(existsSync(ledger) ? readFileSync(ledger, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).runId) : []);
const spent = () => (existsSync(ledger) ? readFileSync(ledger, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).usage?.costListPrice ?? 0) : []).reduce((a, b) => a + b, 0);

function git(cwd, ...gitArgs) {
  return spawnSync("git", ["-c", "user.name=pilot", "-c", "user.email=pilot@localhost", "-c", "commit.gpgsign=false", ...gitArgs], { cwd, encoding: "utf8" });
}

function prepare(run) {
  const dir = join(scratch, "runs", run.runId);
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
  let pkg = null;
  if (run.config !== "off") {
    pkg = join(dir, "pkg", "pi-workbench");
    cpSync(join(variants, plan.configs[run.config].variant), pkg, { recursive: true });
  }
  return { dir, work, pkg };
}

function command(run, { dir, pkg }) {
  const flags = ["-p", "--mode", "json", "--session-dir", join(dir, "session"), "--no-extensions", "-e", PROVIDER_EXTENSION];
  if (pkg) flags.push("-e", join(pkg, "index.js"));
  flags.push("--no-skills");
  if (pkg) flags.push("--skill", join(pkg, "skills"));
  flags.push("--no-context-files", "--no-prompt-templates", "--no-themes", "--no-mcp", "--tools", plan.tools.join(","), "--model", (run.model ?? plan.model).id, "--thinking", (run.model ?? plan.model).thinking);
  const prompt = readFileSync(join(tasksDir, run.task, "prompt.md"), "utf8").trim();
  const config = plan.configs[run.config];
  const messages = [...(config.commands ?? []), ...(config.select ? [`/workbench skill ${config.select}`] : []), prompt];
  return [...flags, ...messages];
}

function environment({ dir }) {
  const home = join(dir, "home");
  return {
    PATH: process.env.PATH, LANG: "C.UTF-8", TERM: "dumb", HOME: home, TMPDIR: join(dir, "tmp"),
    PI_CODING_AGENT_DIR: join(dir, "agent"), PI_OFFLINE: "1", PI_TELEMETRY: "0",
    NPM_CONFIG_PREFIX: join(home, ".npm-global"), npm_config_cache: join(home, ".npm"), PIP_CACHE_DIR: join(home, ".pip"),
    CARGO_HOME: join(home, ".cargo"), BUN_INSTALL: join(home, ".bun"), UV_CACHE_DIR: join(home, ".uv"), PYTHONDONTWRITEBYTECODE: "1",
    ...(PYTHON_PATH ? { PYTHONPATH: PYTHON_PATH } : {}),
  };
}

/** Summarise the JSON event stream: usage once per assistant message_end, tool calls with their results. */
function summarise(events) {
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costListPrice: 0, assistantMessages: 0 };
  const tools = [];
  const byId = new Map();
  const models = new Set();
  let finalText = "";
  let stopReason = null;
  let errorMessage = null;
  let settled = false;
  const retries = [];
  for (const event of events) {
    if (event.type === "auto_retry_start") retries.push(event.errorMessage);
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
      for (const part of m.content ?? []) {
        if (part.type === "toolCall") {
          const call = { id: part.id, name: part.name, args: part.arguments, isError: null, resultChars: 0 };
          byId.set(part.id, call);
          tools.push(call);
        }
      }
    }
    if (event.type === "tool_execution_end") {
      const call = byId.get(event.toolCallId);
      if (call) {
        call.isError = Boolean(event.isError);
        const content = event.result?.content ?? [];
        call.resultChars = content.reduce((n, p) => n + (p.text?.length ?? 0), 0);
        if (call.name === "bash") call.output = content.map((p) => p.text ?? "").join("").slice(-1500);
      }
    }
    if (event.type === "agent_settled") settled = true;
  }
  return { usage, tools, models: [...models], finalText, stopReason, errorMessage, settled, retries };
}

/** Which Workbench files the model actually opened (read tool or a shell command naming the path). */
function exposure(tools, pkg) {
  const touched = new Set();
  for (const call of tools) {
    const text = call.name === "read" ? String(call.args?.path ?? "") : call.name === "bash" ? String(call.args?.command ?? "") : "";
    for (const match of text.matchAll(/pi-workbench\/((?:skills|vendor|docs)\/[^\s"'`;|&)]+)/g)) touched.add(match[1]);
    if (pkg && call.name === "read" && !String(call.args?.path ?? "").startsWith("/") && /^(skills|vendor|docs)\//.test(String(call.args?.path ?? ""))) touched.add(call.args.path);
  }
  return [...touched].sort();
}

function grade(run, { work, dir }) {
  const task = join(tasksDir, run.task);
  const env = { ...process.env, TMPDIR: join(dir, "tmp"), TASK_REPO: work, TASK_ORIGINAL: join(task, "repo"), PYTHONDONTWRITEBYTECODE: "1" };
  const result = { checks: {} };
  if (existsSync(join(task, "hidden/acceptance.test.mjs"))) {
    const test = spawnSync("node", ["--test", "--test-reporter=tap", join(task, "hidden/acceptance.test.mjs")], { env, encoding: "utf8", timeout: 120000 });
    for (const match of test.stdout.matchAll(/^(not ok|ok) \d+ - (.+)$/gm)) result.checks[match[2]] = match[1] === "ok";
    result.checks.acceptance = test.status === 0 && Object.keys(result.checks).length > 0;
  }
  if (existsSync(join(task, "hidden/grade.py"))) {
    const graded = spawnSync("python3", [join(task, "hidden/grade.py"), work], { env, encoding: "utf8", timeout: 120000 });
    try { Object.assign(result, JSON.parse(graded.stdout)); } catch { result.checks.acceptance = false; result.error = graded.stderr.slice(-500); }
  }
  const visible = existsSync(join(work, "test")) ? spawnSync("node", ["--test"], { cwd: work, env, encoding: "utf8", timeout: 120000 }) : null;
  result.visibleTestsPass = visible ? visible.status === 0 : null;
  git(work, "add", "-A");
  const stat = git(work, "diff", "--cached", "--numstat", "HEAD").stdout.trim().split("\n").filter(Boolean).map((l) => l.split("\t"));
  result.diff = { files: stat.map(([a, d, f]) => ({ file: f, added: Number(a) || 0, deleted: Number(d) || 0 })) };
  result.diff.added = result.diff.files.reduce((n, f) => n + f.added, 0);
  result.diff.deleted = result.diff.files.reduce((n, f) => n + f.deleted, 0);
  writeFileSync(join(dir, "final.diff"), git(work, "diff", "--cached", "HEAD").stdout);
  return result;
}

function behaviour(tools, finalText) {
  const commands = tools.filter((c) => c.name === "bash").map((c) => String(c.args?.command ?? ""));
  const lastEdit = tools.map((c, i) => (["edit", "write"].includes(c.name) || /sed -i|> *src\/|tee /.test(c.name === "bash" ? String(c.args?.command ?? "") : "") ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  const after = tools.slice(lastEdit + 1).filter((c) => c.name === "bash").map((c) => String(c.args?.command ?? ""));
  return {
    toolCalls: tools.length,
    toolErrors: tools.filter((c) => c.isError).length,
    ranTestsAfterLastEdit: after.some((c) => /node --test|npm (run )?test|npm t\b/.test(c)),
    ranCliAfterLastEdit: after.some((c) => /node bin\/|bin\/timer|bin\/report/.test(c)),
    ranBuild: commands.some((c) => /npm run build|node scripts\/build/.test(c)),
    installAttempts: commands.filter((c) => /\b(npm|pnpm|yarn|bun) (i|install|add)\b|\bnpx\b|pip3? install|cargo install|brew install|apt(-get)? install|uv (tool|pip) install/.test(c)),
    toolProbe: commands.filter((c) => /ast-grep|\bsg\b --|ctx7|context7/.test(c)),
    claimsPass: /통과|pass(ed|es)?\b|성공|모두 녹색|all green/i.test(finalText),
  };
}

async function execute(run) {
  const paths = prepare(run);
  const started = Date.now();
  const child = spawn("pi", command(run, paths), { cwd: paths.work, env: environment(paths), stdio: ["ignore", "pipe", "pipe"] });
  const events = [];
  let buffer = "";
  let stderr = "";
  let killed = null;
  let tools = 0;
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
      appendFileSync(join(paths.dir, "events.jsonl"), line + "\n");
      let event;
      try { event = JSON.parse(line); } catch { continue; }
      if (event.type === "message_update") continue;
      events.push(event);
      if (event.type === "message_end" && event.message?.role === "assistant") {
        cost += event.message.usage?.cost?.total ?? 0;
        tools += (event.message.content ?? []).filter((p) => p.type === "toolCall").length;
        if (tools > plan.limits.maxToolCalls) stop("tool-cap");
        if (cost > plan.limits.runCostCapListPrice) stop("cost-cap");
      }
    }
  });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exitCode = await new Promise((done) => child.on("close", (code, signal) => done(code ?? signal)));
  clearTimeout(timer);
  const wallSeconds = (Date.now() - started) / 1000;
  const summary = summarise(events);
  const graded = grade(run, paths);
  const record = {
    runId: run.runId, task: run.task, config: run.config, rep: run.rep, order: run.order,
    variant: plan.configs[run.config].variant, variantHash: plan.variantHashes?.[plan.configs[run.config].variant] ?? null,
    model: run.model ?? plan.model, modelsSeen: summary.models, startedAt: new Date(started).toISOString(), wallSeconds, exitCode, killed,
    stopReason: summary.stopReason, errorMessage: summary.errorMessage, settled: summary.settled, retries: summary.retries, stderrTail: stderr.slice(-400),
    usage: summary.usage, exposure: exposure(summary.tools, paths.pkg), behaviour: behaviour(summary.tools, summary.finalText),
    grade: graded, finalText: summary.finalText.slice(0, 4000),
    toolLog: summary.tools.map((c) => ({ name: c.name, args: c.name === "write" ? { path: c.args?.path, chars: String(c.args?.content ?? "").length } : c.name === "edit" ? { path: c.args?.path, edits: c.args?.edits?.length } : c.args, isError: c.isError, resultChars: c.resultChars })),
  };
  appendFileSync(ledger, JSON.stringify(record) + "\n");
  console.log(`${run.runId} exit=${exitCode}${killed ? ` killed=${killed}` : ""} accept=${graded.checks.acceptance} tools=${record.behaviour.toolCalls} cost=$${summary.usage.costListPrice.toFixed(3)} wall=${wallSeconds.toFixed(0)}s exposure=${record.exposure.length}`);
}

const queue = plan.runs.filter((run) => !done.has(run.runId) && (!only || only.has(run.runId)));
console.log(`${queue.length} runs queued (${done.size} already recorded); spent so far $${spent().toFixed(2)} list price`);
let stopped = false;
async function worker() {
  while (queue.length) {
    if (spent() >= plan.limits.totalCostCapListPrice - plan.limits.runCostCapListPrice) {
      if (!stopped) console.log(`total cost cap reached ($${spent().toFixed(2)}); not starting more runs`);
      stopped = true;
      return;
    }
    await execute(queue.shift());
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
