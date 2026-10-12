// Writes the fixed pilot plan (configurations, matrix, run order, limits) before any model run.
// node make_plan.mjs <variants dir> <plan.json> [stage] [shared-tmp-trace.json runs-stage1.jsonl,runs-stage2.jsonl]
import { readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_ISOLATION } from "./sandbox.mjs";
import { join } from "node:path";

// Stages: "1" = natural auto discovery and forced DMAIC selection with the main model; "2" = pre-registered after stage 1
// (all stage 1 runs accepted, vendor skills not opened in natural auto): profile mode with the main model, and the stage 1
// matrix repeated with a smaller model as a sensitivity check.
// "3" = replacement of the pair groups whose runs shared host /tmp resources with another run or used /tmp in a way
// the trace cannot resolve; same model, task, configuration and repetition, run inside the sandbox.mjs boundary.
const [variants, target, stage = "1", traceFile, ledgerFiles] = process.argv.slice(2);
const hashes = JSON.parse(readFileSync(join(variants, "hashes.json"), "utf8"));

const configs = {
  off: { variant: null, meaning: "No Workbench extension, routing skills or explicit selection (Pi with the same tools and model only)." },
  current: { variant: "current", meaning: "Workbench 3016176 as shipped (corrected content), natural auto discovery of the seven routing skills." },
  r1: { variant: "r1-no-default-ponytail-ecc", meaning: "R1: coding path no longer defaults to Ponytail full and ECC search-first; both stay listed and selectable." },
  r2: { variant: "r2-verification-principle", meaning: "R2: Verification Before Completion removed from routers and catalog; one common verification principle added to the workflow guide." },
  r3a: { variant: "r3a-manual-only", meaning: "R3 manual-only: tool/environment-dependent skills removed from every router (selectable only with /workbench skill)." },
  r3b: { variant: "r3b-conditional", meaning: "R3 conditional: the same skills stay listed with an explicit 'use only when <tool/condition> already exists; do not install it' gate." },
  r4: { variant: "r4-split-dmaic", meaning: "R4: DMAIC SKILL.md split into an entry file and one reference per phase (text moved verbatim)." },
  "current-select": { variant: "current", select: "dmaic", meaning: "Forced exposure: /workbench skill dmaic attached to the request (current DMAIC)." },
  "r4-select": { variant: "r4-split-dmaic", select: "dmaic", meaning: "Forced exposure: /workbench skill dmaic attached to the request (split DMAIC entry file)." },
};

if (stage !== "1") Object.assign(configs, {
  "current-profile": { variant: "current", commands: ["/workbench use coding"], meaning: "Profile mode: /workbench use coding before the request (profile guidance injected per request), current." },
  "r1-profile": { variant: "r1-no-default-ponytail-ecc", commands: ["/workbench use coding"], meaning: "Profile mode with the R1 variant." },
  "r2-profile": { variant: "r2-verification-principle", commands: ["/workbench use coding"], meaning: "Profile mode with the R2 variant." },
  "r3a-profile": { variant: "r3a-manual-only", commands: ["/workbench use coding"], meaning: "Profile mode with the R3 manual-only variant." },
  "r3b-profile": { variant: "r3b-conditional", commands: ["/workbench use coding"], meaning: "Profile mode with the R3 conditional variant." },
  "current-mfg": { variant: "current", commands: ["/workbench use manufacturing"], meaning: "Profile mode: /workbench use manufacturing, current DMAIC." },
  "r4-mfg": { variant: "r4-split-dmaic", commands: ["/workbench use manufacturing"], meaning: "Profile mode: /workbench use manufacturing, split DMAIC." },
});

const stage1 = [
  { task: "T1-csv-export", configs: ["off", "current", "r1", "r2"], purpose: "R1/R2 on a feature task (minimal change, no new dependency, verification)" },
  { task: "T2-duration-cli", configs: ["off", "current", "r1", "r2"], purpose: "R1/R2 on a bug whose CLI symptom is only fixed after the generated lib is rebuilt" },
  { task: "T3-migrate-calls", configs: ["off", "current", "r3a", "r3b"], purpose: "R3 structural refactor where ast-grep would fit but is not installed" },
  { task: "T4-coolant-decision", configs: ["off", "current", "r4"], purpose: "R4 natural discovery on a confounded process-change decision" },
  { task: "T4-coolant-decision", configs: ["current-select", "r4-select"], purpose: "R4 forced exposure (explicit selection), reported separately" },
];

// Deterministic order: repetition 1 interleaves tasks and configurations with a fixed seeded shuffle; repetition 2 runs in reverse.
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
const MAIN = { provider: "cliproxyapi", id: "cliproxyapi/claude-opus-5-5", thinking: "high" };
const SMALL = { provider: "cliproxyapi", id: "cliproxyapi/claude-haiku-5-5", thinking: "high" };
const stage2Profile = [
  { task: "T1-csv-export", configs: ["current-profile", "r1-profile", "r2-profile"], purpose: "R1/R2 with the coding profile guidance injected" },
  { task: "T2-duration-cli", configs: ["current-profile", "r1-profile", "r2-profile"], purpose: "R1/R2 with the coding profile guidance injected" },
  { task: "T3-migrate-calls", configs: ["current-profile", "r3a-profile", "r3b-profile"], purpose: "R3 with the coding profile guidance injected" },
  { task: "T4-coolant-decision", configs: ["current-mfg", "r4-mfg"], purpose: "R4 with the manufacturing profile guidance injected" },
];
const matrix = stage === "1" ? stage1 : [...stage2Profile.map((m) => ({ ...m, model: MAIN })), ...stage1.map((m) => ({ ...m, model: SMALL, purpose: `${m.purpose} (smaller-model sensitivity)` }))];
const cells = matrix.flatMap((m) => m.configs.map((config) => ({ task: m.task, config, ...(m.model && stage !== "1" ? { model: m.model } : {}) })));
const first = shuffle(cells, stage === "1" ? 20261012 : 20261013);
let runs = [...first.map((c) => ({ ...c, rep: 1 })), ...[...first].reverse().map((c) => ({ ...c, rep: 2 }))]
  .map((run, order) => ({ ...run, order, runId: `${stage === "1" ? "" : run.model.id.includes("haiku") ? "S2h-" : "S2-"}${run.task.slice(0, 2)}-${run.config}-r${run.rep}` }));
let replacement = null;
if (stage === "3") {
  const trace = JSON.parse(readFileSync(traceFile, "utf8"));
  const recorded = ledgerFiles.split(",").flatMap((file) => readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)));
  const mode = (config) => (config.includes("select") ? "select" : config.includes("profile") || config.includes("mfg") ? "profile" : "auto");
  const group = (run) => [run.model.id, run.task, mode(run.config), run.rep].join("|");
  const triggers = [...new Set([...trace.runsSharingAResourceWithAnotherRun, ...Object.keys(trace.runsWithUnresolvedTmpUse)])].sort();
  const groups = new Set(recorded.filter((run) => triggers.includes(run.runId)).map(group));
  const scope = recorded.filter((run) => groups.has(group(run))).map((run) => ({ task: run.task, config: run.config, rep: run.rep, model: { provider: run.model.provider, id: run.model.id, thinking: run.model.thinking }, replaces: run.runId }));
  runs = shuffle(scope.sort((a, b) => a.replaces.localeCompare(b.replaces)), 20261014).map((run, order) => ({ ...run, order, runId: `S3-${run.replaces}` }));
  replacement = { rule: "Replace every pair group (model, task, exposure mode, repetition) containing a run that shared a host /tmp resource with another run or used /tmp in a way the trace cannot resolve.", triggers, groups: [...groups].sort() };
}

const plan = {
  createdAt: new Date().toISOString(),
  baseline: { repository: "zmfkzj/pi-workbench", commit: "3016176fe38ea3b51bc5654c083d56f211525de0" },
  stage,
  ...(stage === "3" ? { isolation: DEFAULT_ISOLATION, replacement } : {}),
  model: { ...MAIN, note: "Same model as the requesting main session; cost per message is Pi's list-price calculation from the provider's model catalog, not an invoice." },
  tools: ["read", "bash", "edit", "write"],
  limits: { concurrency: 4, runTimeoutSeconds: 900, maxToolCalls: 80, runCostCapListPrice: 4, totalCostCapListPrice: stage === "1" ? 60 : stage === "2" ? 40 : 8, plannedRuns: runs.length },
  variantHashes: hashes,
  configs,
  matrix,
  runs,
};
writeFileSync(target, JSON.stringify(plan, null, 2) + "\n");
console.log(`${runs.length} runs planned`);
