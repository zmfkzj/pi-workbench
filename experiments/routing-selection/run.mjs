// Routing selection measurement: real Pi sessions (print mode, JSON events) that receive one representative request
// from tests/routing-requests.json and record which Workbench files the model opened. It compares package variants
// (for example the committed routing text and a working-tree change) under the same model, tools and prompt.
//
// Usage: node experiments/routing-selection/run.mjs --scratch DIR --variant NAME=PACKAGE_DIR [--variant ...]
//          [--model cliproxyapi/claude-haiku-5-5] [--thinking low] [--reps 3] [--concurrency 4] [--requests id,id]
//          [--out results.jsonl] [--ledger ledger.jsonl] [--cost-cap 5] [--stage NAME] [--chrome PATH [--chrome-no-sandbox]]
//          [--artifacts DIR]
//
// Each run gets its own directory under --scratch: a fresh Pi agent dir (settings and model catalogs copied, no
// credentials written; the CLIProxyAPI key is passed as CLIPROXYAPI_API_KEY), a working directory (empty, or a copy of
// the request scenario's fixture) and a session dir. Pi runs inside bubblewrap: the host is read-only, HOME and the
// scratch root are hidden, and only the run directory (writable) and its own package copy (read-only, opaque path) are
// visible. The request's scenario (tests/routing-requests.json `scenarios`) sets the tools (default read, grep, find,
// ls), the fixture, the limits and whether a browser for Archify is visible (--chrome, bound read-only and passed as
// ARCHIFY_CHROME). Pi discovery is off except the provider extension, the variant's Workbench extension and its skills.
// A run ends when the agent finishes, after the scenario's tool-call limit, at its time limit or above its cost cap.
//
// Package copies are content-addressed (a hash of the copied files), and a run ID names the package hash and the
// request/scenario hash, so a changed variant or request is a new run rather than a reused record. Costs of every
// run, from any stage or result file, go to one ledger; a new run starts only while the ledger total plus the cost
// cap reserved for every run in flight stays within --cost-cap. A run without a reported cost is charged its cap.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createObserver } from "./observe.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const home = homedir();
const AGENT = join(home, ".pi/agent");
const PROVIDER = join(AGENT, "git/github.com/zmfkzj/oh-my-pi-extensions/cliproxyapi");
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const variants = Object.fromEntries(args.flatMap((a, i) => (a === "--variant" ? [args[i + 1].split("=")] : [])));
const scratch = resolve(option("scratch"));
const model = option("model", "cliproxyapi/claude-haiku-5-5");
const thinking = option("thinking", "low");
const reps = Number(option("reps", "3"));
const concurrency = Number(option("concurrency", "4"));
const totalCap = Number(option("cost-cap", "5"));
const stage = option("stage", "default");
const out = resolve(option("out", join(scratch, "results.jsonl")));
const ledger = resolve(option("ledger", join(scratch, "ledger.jsonl")));
const artifacts = option("artifacts") ? resolve(option("artifacts")) : null;
const chrome = option("chrome") ? realpathSync(option("chrome")) : null;
// Chrome's own sandbox needs unprivileged user namespaces, which Ubuntu 23.10+ restricts and which are unavailable inside
// bubblewrap; --chrome-no-sandbox passes ARCHIFY_CHROME_NO_SANDBOX=1 to browser scenarios only. The browser then runs
// inside this run's bubblewrap sandbox (host read-only, HOME hidden) and loads only pages generated in the run.
const chromeNoSandbox = args.includes("--chrome-no-sandbox");
const only = option("requests") ? new Set(option("requests").split(",")) : null;
const requestFile = JSON.parse(readFileSync(join(repo, "tests/routing-requests.json"), "utf8"));
const requests = requestFile.requests.filter((r) => !only || only.has(r.id));
const scenarios = requestFile.scenarios ?? {};
const sha = (text) => createHash("sha256").update(text).digest("hex");
const providerConfig = JSON.parse(readFileSync(join(AGENT, "pi-cliproxyapi-provider/config.json"), "utf8"));
const baseUrl = providerConfig.baseUrl;
const providerName = providerConfig.providerName ?? "cliproxyapi";
const MODEL_CACHE = join(home, ".cache/pi-cliproxyapi-provider");
const apiKey = JSON.parse(readFileSync(join(AGENT, "auth.json"), "utf8"))[providerName]?.key;
if (!apiKey || !Object.keys(variants).length) throw new Error("need a cliproxyapi key and at least one --variant");
if (only && requests.length !== only.size) throw new Error(`unknown request id in --requests: ${[...only].filter((id) => !requests.some((r) => r.id === id)).join(",")}`);

const PARTS = ["index.js", "lib", "skills", "catalog.json", "docs", "vendor", "package.json"];
/** Files under `dir` (sorted, relative) with their SHA-256: the manifest the package hash is computed from. */
function manifest(dir) {
  const lines = [];
  const walk = (path) => {
    if (statSync(path).isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name));
    else lines.push(`${relative(dir, path)} ${sha(readFileSync(path))}`);
  };
  for (const part of PARTS) walk(join(dir, part));
  return lines.join("\n");
}

/** Scenario of a request: tools, fixture, browser and limits (defaults: the read-only routing measurement). */
function scenarioOf(request) {
  const s = scenarios[request.scenario ?? "readonly"];
  if (!s) throw new Error(`${request.id}: unknown scenario ${request.scenario}`);
  return { tools: "read,grep,find,ls", maxTools: 14, timeLimit: 240, runCostCap: 0.5, browser: false, ...s, name: request.scenario ?? "readonly" };
}

// Opaque, content-addressed package copies: the path a model sees names neither the variant nor its source.
const packages = {};
for (const [name, source] of Object.entries(variants)) {
  const hash = sha(manifest(resolve(source))).slice(0, 12);
  const target = join(scratch, "pkgs", hash, "pi-workbench");
  if (!existsSync(join(target, "package.json"))) for (const part of PARTS) cpSync(join(source, part), join(target, part), { recursive: true });
  if (sha(manifest(target)).slice(0, 12) !== hash) throw new Error(`package copy ${target} differs from ${source}`);
  const catalog = JSON.parse(readFileSync(join(target, "catalog.json"), "utf8"));
  const routes = readdirSync(join(target, "skills")).sort().map((dir) => readFileSync(join(target, "skills", dir, "SKILL.md"), "utf8"));
  packages[name] = { dir: target, catalog, hash, routingHash: sha(routes.join("\n")) };
}

const readJsonl = (file) => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const done = new Set(readJsonl(out).map((r) => r.runId));
/** Ledger total: reported costs, and the cap of every run whose cost is unknown. */
const committed = () => readJsonl(ledger).reduce((n, r) => n + (r.costMissing ? Math.max(r.cost ?? 0, r.runCostCap) : (r.cost ?? 0)), 0);
const queue = [];
for (let rep = 1; rep <= reps; rep++) for (const request of requests) for (const variant of Object.keys(variants)) {
  const scenario = scenarioOf(request);
  const requestHash = sha(JSON.stringify({ request: request.request, scenario })).slice(0, 8);
  const runId = `${model}:${thinking}:${variant}@${packages[variant].hash}:${request.id}#${requestHash}:${rep}`;
  if (!done.has(runId)) queue.push({ runId, variant, request, scenario, rep });
}

function bwrap(runDir, pkgDir) {
  const node = dirname(process.execPath);
  const a = ["--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc", "--tmpfs", "/tmp", "--tmpfs", home, "--tmpfs", scratch];
  for (const path of [join(home, ".bun"), resolve(node, ".."), PROVIDER]) a.push("--ro-bind", path, path);
  if (chrome) a.push("--ro-bind", dirname(chrome), dirname(chrome));
  a.push("--ro-bind", pkgDir, pkgDir, "--bind", runDir, runDir, "--unshare-pid", "--unshare-ipc", "--die-with-parent", "--chdir", join(runDir, "work"), "--");
  return a;
}

function listFiles(dir) {
  const files = [];
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(relative(dir, full));
    }
  };
  if (existsSync(dir)) walk(dir);
  return files.sort();
}

async function run(item) {
  const pkg = packages[item.variant];
  const { scenario } = item;
  const runDir = join(scratch, "runs", sha(`run:${item.runId}`).slice(0, 16));
  rmSync(runDir, { recursive: true, force: true });
  for (const sub of ["agent", "work", "session", "home", "tmp"]) mkdirSync(join(runDir, sub), { recursive: true });
  if (scenario.fixture) cpSync(join(here, "fixtures", scenario.fixture), join(runDir, "work"), { recursive: true });
  const fixtureFiles = new Set(listFiles(join(runDir, "work")));
  writeFileSync(join(runDir, "agent/settings.json"), JSON.stringify({ defaultProvider: "cliproxyapi", quietStartup: true, compaction: { enabled: false } }));
  for (const file of ["cliproxyapi-models.json", "models.json"]) if (existsSync(join(AGENT, file))) cpSync(join(AGENT, file), join(runDir, "agent", file));
  // The provider's discovered model list (no credentials) so the run does not depend on a fresh /models discovery.
  if (existsSync(MODEL_CACHE)) cpSync(MODEL_CACHE, join(runDir, "home/.cache/pi-cliproxyapi-provider"), { recursive: true });
  const piArgs = ["-p", "--mode", "json", "--session-dir", join(runDir, "session"), "--no-extensions", "-e", join(PROVIDER, "src/index.ts"), "-e", join(pkg.dir, "index.js"),
    "--no-skills", "--skill", join(pkg.dir, "skills"), "--no-context-files", "--no-prompt-templates", "--no-themes", "--no-mcp",
    "--tools", scenario.tools, "--model", model, "--thinking", thinking, item.request.request];
  const env = { PATH: [join(home, ".bun/bin"), dirname(process.execPath), "/usr/local/bin", "/usr/bin", "/bin"].join(":"), LANG: "C.UTF-8", TERM: "dumb",
    HOME: join(runDir, "home"), TMPDIR: join(runDir, "tmp"), PI_CODING_AGENT_DIR: join(runDir, "agent"), PI_TELEMETRY: "0",
    CLIPROXYAPI_API_KEY: apiKey, CLIPROXYAPI_BASE_URL: baseUrl, CLIPROXYAPI_PROVIDER_NAME: providerName,
    ARCHIFY_UPDATE_CHECK_DISABLED: "1" };
  if (scenario.browser && chrome) {
    env.ARCHIFY_CHROME = chrome;
    // Chrome's profile socket path must be short: use the sandbox's private /tmp instead of the run directory.
    env.TMPDIR = "/tmp";
    if (chromeNoSandbox) env.ARCHIFY_CHROME_NO_SANDBOX = "1";
  }
  const started = Date.now();
  const child = spawn("bwrap", [...bwrap(runDir, pkg.dir), "pi", ...piArgs], { env, stdio: ["ignore", "pipe", "pipe"] });
  const mask = (text) => text.replaceAll(pkg.dir, "<pkg>").replaceAll(runDir, "<run>").replaceAll(scratch, "<scratch>");
  const observer = createObserver({ pkg, cwd: join(runDir, "work"), home: join(runDir, "home"), mask });
  let buffer = "", stderr = "";
  let stop = /** @type {string | null} */ (null);
  const kill = (reason) => { if (!stop) { stop = reason; child.kill("SIGTERM"); } };
  const timer = setTimeout(() => kill("time"), scenario.timeLimit * 1000);
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, i); buffer = buffer.slice(i + 1);
      let event; try { event = JSON.parse(line); } catch { continue; }
      observer.handle(event);
      if (observer.toolStarts > scenario.maxTools) kill("max-tools");
      if (observer.cost > scenario.runCostCap) kill("cost-cap");
    }
  });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exit = await new Promise((r) => child.on("close", (code) => r(code)));
  clearTimeout(timer);
  const r = item.request;
  const summary = observer.summary(r);
  const created = listFiles(join(runDir, "work")).filter((file) => !fixtureFiles.has(file));
  // Archify's own finalize receipts are the evidence of its gates (stdout parsing in observe.mjs is only a hint).
  const finalizeReceipts = created.filter((file) => file.endsWith(".finalize-summary.json")).map((file) => {
    try {
      const receipt = JSON.parse(readFileSync(join(runDir, "work", file), "utf8"));
      return { file, status: receipt.status ?? null, mtimeMs: statSync(join(runDir, "work", file)).mtimeMs };
    } catch { return { file, status: "unreadable" }; }
  }).sort((a, b) => (a.mtimeMs ?? 0) - (b.mtimeMs ?? 0)).map(({ file, status }) => ({ file, status }));
  const record = {
    runId: item.runId, stage, variant: item.variant, packageHash: pkg.hash, routingHash: pkg.routingHash, model, thinking,
    request: r.id, heldOut: Boolean(r.heldOut), negative: !r.skills.length, scenario: scenario.name, tools: scenario.tools,
    finalizeReceipts, finalizeReceiptPass: finalizeReceipts.length ? finalizeReceipts.at(-1).status === "pass" : null,
    browser: Boolean(scenario.browser && chrome), chromeNoSandbox: Boolean(scenario.browser && chrome && chromeNoSandbox), rep: item.rep, ...summary, createdFiles: created,
    exit, stop, wallSeconds: Math.round((Date.now() - started) / 1000), finalChars: summary.finalText.length,
    runCostCap: scenario.runCostCap, stderrTail: mask(stderr.slice(-300)), artifactDir: /** @type {string | null} */ (null),
  };
  if (artifacts && created.length) {
    const target = join(artifacts, sha(item.runId).slice(0, 16));
    for (const file of created) cpSync(join(runDir, "work", file), join(target, file), { recursive: true });
    record.artifactDir = target;
  }
  appendFileSync(out, JSON.stringify(record) + "\n");
  appendFileSync(ledger, JSON.stringify({ runId: item.runId, stage, file: out, cost: summary.cost, costMissing: summary.costMissing, runCostCap: scenario.runCostCap }) + "\n");
  rmSync(runDir, { recursive: true, force: true });
  console.log(`${item.runId} routers=${summary.routers.join(",") || "-"} skills=${summary.skills.join(",") || "-"}${summary.specialists.length ? ` spec=${summary.specialists.join(",")}` : ""}${summary.wrappers.length ? ` wrap=${summary.wrappers.join(",")}` : ""} index=${summary.researchIndex ? "y" : "n"} invalid=${summary.invalidPaths.length} tools=${summary.toolCalls} cost=$${summary.cost.toFixed(3)}${summary.costMissing ? "?" : ""} ${stop ?? `exit=${exit}`}${summary.error ? ` error=${summary.error.slice(0, 80)}` : ""}`);
}

console.log(`${queue.length} runs queued; ledger $${committed().toFixed(2)}; cap $${totalCap}`);
let inFlight = 0;
const reserved = [];
await new Promise((finish) => {
  const next = () => {
    while (inFlight < concurrency && queue.length) {
      const item = queue[0];
      if (committed() + reserved.reduce((n, x) => n + x, 0) + item.scenario.runCostCap > totalCap) { console.log(`cost cap reached; ${queue.length} runs not started`); queue.length = 0; break; }
      queue.shift();
      inFlight++;
      reserved.push(item.scenario.runCostCap);
      run(item).catch((e) => {
        // The run may have spent money before failing: charge its cap.
        appendFileSync(ledger, JSON.stringify({ runId: item.runId, stage, file: out, cost: 0, costMissing: true, runCostCap: item.scenario.runCostCap, harnessError: e.message }) + "\n");
        console.log(`${item.runId} harness error ${e.message}`);
      }).finally(() => { inFlight--; reserved.splice(reserved.indexOf(item.scenario.runCostCap), 1); next(); });
    }
    if (!queue.length && !inFlight) finish();
  };
  next();
});
console.log(`ledger $${committed().toFixed(2)} of cap $${totalCap}`);
