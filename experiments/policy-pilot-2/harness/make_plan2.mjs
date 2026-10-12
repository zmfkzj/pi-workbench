// Writes a follow-up plan before any model run of that stage.
// node make_plan2.mjs <variants dir> <plan.json> <stage: calibration|main|haiku>
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ISOLATION } from "./sandbox2.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const tasksDir = join(here, "..", "tasks");
const [variants, target, stage] = process.argv.slice(2);
if (!["calibration", "main", "haiku"].includes(stage)) throw new Error("stage must be calibration, main or haiku");
const hashes = JSON.parse(readFileSync(join(variants, "hashes.json"), "utf8"));

function treeHash(root) {
  const hash = createHash("sha256");
  const walk = (dir) => readdirSync(dir).sort().forEach((name) => {
    const path = join(dir, name);
    if (name === "__pycache__") return;
    if (statSync(path).isDirectory()) walk(path);
    else hash.update(relative(root, path) + "\0").update(readFileSync(path)).update("\0");
  });
  walk(root);
  return hash.digest("hex");
}

const TASKS = ["A-ledger-min-amount", "B-logger-migration", "C-msa-capability", "D-probe-retries"];
const tasks = {
  "A-ledger-min-amount": {
    purpose: "R1/R2: feature that must reuse the locale-aware amount parser, reach CLI and API, keep output unchanged; over-change and verification",
    verify: { tests: "node --test|npm (run )?test", cliWithOption: "bin/ledger\\.js[^\\n]*--min-amount" },
    allowed: ["^bin/ledger\\.js$", "^src/(api|export|read|amount)\\.js$", "^test/", "^README\\.md$"],
  },
  "B-logger-migration": {
    purpose: "R3: structural migration of 24 modules with aliases, namespace imports and shadowed names; ast-grep 0.50.0 is installed on PATH",
    verify: { tests: "node --test|npm (run )?test", searchRemaining: "(grep|rg|ast-grep|sg)\\b[^\\n]*log" },
    allowed: ["^src/(services|jobs)/", "^test/"],
  },
  "C-msa-capability": {
    purpose: "R4: gauge R&R + Xbar-R + capability decision; DMAIC MSA/stability guidance is relevant, numbers are code-checked",
    verify: { compute: "python3|node " },
    allowed: ["^results\\.json$", "^report\\.md$", "\\.(py|mjs|js)$"],
  },
  "D-probe-retries": {
    purpose: "R1/R2: bug with two causes (falsy retries default, unstripped inline comments) where only the reported command reveals the second; quoted # must survive",
    verify: { tests: "node --test|npm (run )?test", reportedCommand: "bin/probe\\.js[^\\n]*fail-fast\\.conf" },
    allowed: ["^src/(config|probe)\\.js$", "^test/", "^README\\.md$"],
  },
};

const configs = {
  off: { variant: null, meaning: "No Workbench (provider only)." },
  current: { variant: "current", meaning: "Current package, natural auto discovery (routers only)." },
  "cur-prof": { variant: "current", commands: ["/workbench use coding"], meaning: "Current, coding profile guidance injected (lists skill paths; default Ponytail full + ECC search-first)." },
  "r1-prof": { variant: "r1", commands: ["/workbench use coding"], meaning: "R1 variant (no default Ponytail/ECC wording), coding profile." },
  "r2-prof": { variant: "r2", commands: ["/workbench use coding"], meaning: "R2 variant (Verification removed, principle in workflow guide), coding profile." },
  "sel-pe": { variant: "current", select: ["ponytail", "search-first"], meaning: "Content: Ponytail full + ECC search-first SKILL.md attached to the request (auto mode)." },
  "sel-ver": { variant: "current", select: ["verification-before-completion"], meaning: "Content: Verification Before Completion SKILL.md attached (auto mode)." },
  "sel-prin": { variant: "r2", select: ["verification-principle"], meaning: "Content: the r2 common principle attached the same way as sel-ver (auto mode)." },
  r3a: { variant: "r3a2", meaning: "R3 manual-only: tool skills out of routers and profiles (selectable only via /workbench skill), auto." },
  r3b: { variant: "r3b2", meaning: "R3 conditional: tool skills listed with a use-only-when-installed gate, auto." },
  "r3a-prof": { variant: "r3a2", commands: ["/workbench use coding"], meaning: "R3 manual-only, coding profile." },
  "r3b-prof": { variant: "r3b2", commands: ["/workbench use coding"], meaning: "R3 conditional, coding profile." },
  "sel-dmaic": { variant: "current", select: ["dmaic"], meaning: "Content: current DMAIC SKILL.md attached (auto mode)." },
  "r4-sel-dmaic": { variant: "r4", select: ["dmaic"], meaning: "Content: split DMAIC entry SKILL.md attached; phase files must be opened." },
  "cur-mfg": { variant: "current", commands: ["/workbench use manufacturing"], meaning: "Current, manufacturing profile." },
  "r4-mfg": { variant: "r4", commands: ["/workbench use manufacturing"], meaning: "R4 split DMAIC, manufacturing profile." },
};

const matrix = {
  "A-ledger-min-amount": ["off", "current", "cur-prof", "r1-prof", "r2-prof", "sel-pe", "sel-ver", "sel-prin"],
  "D-probe-retries": ["off", "current", "cur-prof", "r1-prof", "r2-prof", "sel-pe", "sel-ver", "sel-prin"],
  "B-logger-migration": ["off", "current", "r3a", "r3b", "cur-prof", "r3a-prof", "r3b-prof"],
  "C-msa-capability": ["off", "current", "sel-dmaic", "r4-sel-dmaic", "cur-mfg", "r4-mfg"],
};

const OPUS = { provider: "cliproxyapi", id: "cliproxyapi/claude-opus-5-5", thinking: "high" };
const HAIKU = { provider: "cliproxyapi", id: "cliproxyapi/claude-haiku-5-5", thinking: "high" };

function shuffle(items, seed) {
  const out = [...items];
  let state = seed;
  const random = () => ((state = (state * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let runs;
let limits;
if (stage === "calibration") {
  const cells = TASKS.flatMap((task) => [{ task, config: "off", model: OPUS }, { task, config: task.startsWith("C") ? "cur-mfg" : "cur-prof", model: OPUS }, { task, config: "off", model: HAIKU }]);
  runs = cells.map((c, order) => ({ ...c, rep: 1, order, runId: `cal-${c.model.id.includes("haiku") ? "h" : "o"}-${c.task.slice(0, 1)}-${c.config}` }));
  limits = { concurrency: 4, runTimeoutSeconds: 1200, maxToolCalls: 120, runCostCapListPrice: 3, totalCostCapListPrice: 12 };
} else {
  const model = stage === "main" ? OPUS : HAIKU;
  const cells = TASKS.flatMap((task) => matrix[task].map((config) => ({ task, config })));
  // Three repetitions; each repetition is a different seeded shuffle of all cells, so order and position vary.
  runs = [1, 2, 3].flatMap((rep) => shuffle(cells, 20261020 + rep).map((c) => ({ ...c, rep })))
    .map((c, order) => ({ ...c, model, order, runId: `${stage === "main" ? "o" : "h"}-${c.task.slice(0, 1)}-${c.config}-r${c.rep}` }));
  limits = stage === "main"
    ? { concurrency: 4, runTimeoutSeconds: 1200, maxToolCalls: 120, runCostCapListPrice: 3, totalCostCapListPrice: 70 }
    : { concurrency: 4, runTimeoutSeconds: 1200, maxToolCalls: 120, runCostCapListPrice: 0.5, totalCostCapListPrice: 8 };
}

const plan = {
  stage,
  baseline: { repository: "zmfkzj/pi-workbench", commit: "44aeb2d", operationalFilesEqualTo: "3016176fe38ea3b51bc5654c083d56f211525de0" },
  model: stage === "haiku" ? HAIKU : OPUS,
  tools: ["read", "bash", "edit", "write"],
  environment: { pi: "1.1.0", node: "v24.21.0", python: "3 (system, no numpy)", astGrep: "0.50.0 on PATH for every run (scratch toolbin, read-only)" },
  isolation: ISOLATION,
  limits: { ...limits, plannedRuns: runs.length },
  variantHashes: hashes,
  taskHashes: Object.fromEntries(TASKS.map((t) => [t, treeHash(join(tasksDir, t))])),
  tasks,
  configs,
  matrix,
  runs,
};
writeFileSync(target, JSON.stringify(plan, null, 2) + "\n");
console.log(`${stage}: ${runs.length} runs planned`);
