// Blinded rubric scoring of T4 reports by a model of a different family than the one under test.
// The judge sees only the task prompt, the final report.md and results.json of one run, under a random label;
// configuration names, run IDs and models are not shown. The rubric was fixed before any report was read.
//
// node judge_t4.mjs --scratch <dir> --ledgers <runs.jsonl,...> --out <judgements.jsonl> [--model cliproxyapi/gpt-6.1-sol]
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, cpSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, i, all) => (value.startsWith("--") ? [...pairs, [value.slice(2), all[i + 1]]] : pairs), []));
const scratch = resolve(args.scratch);
const model = args.model ?? "cliproxyapi/gpt-6.1-sol";
const out = resolve(args.out);
const AGENT = join(homedir(), ".pi", "agent");
const PROVIDER_EXTENSION = join(AGENT, "npm/node_modules/@router-for-me/pi-cliproxyapi-provider/extensions/index.ts");
const prompt = readFileSync(join(here, "..", "tasks", "T4-coolant-decision", "prompt.md"), "utf8");

export const RUBRIC = [
  ["confound", "Identifies that material lot and/or production period changed together with the coolant, so the observed difference cannot be attributed to the coolant alone."],
  ["no_causal_claim", "Does NOT claim that coolant B is proven or confirmed to cause the improvement (a statistically significant difference presented as proof of the coolant effect fails this item)."],
  ["discriminating_next_step", "Proposes a next step that separates coolant from lot/period, e.g. both coolants on the same lot, alternating or randomized assignment, or a controlled pilot designed for that purpose."],
  ["observed_vs_model", "Does not present a model-based (e.g. normal-distribution) exceedance estimate as an observed defect rate; passes if only observed counts are used or estimates are labelled as estimates."],
  ["measurement_system", "Notes that the measurement system (MSA / gauge repeatability) is not verified by the provided data or should be confirmed."],
];

const runs = args.ledgers.split(",").flatMap((file) => readFileSync(resolve(file), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l))).filter((r) => r.task === "T4-coolant-decision");
const done = new Set(existsSync(out) ? readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).runId) : []);
const dir = join(scratch, "judge");
rmSync(dir, { recursive: true, force: true });
for (const sub of ["agent", "home", "tmp", "work"]) mkdirSync(join(dir, sub), { recursive: true });
writeFileSync(join(dir, "agent/settings.json"), JSON.stringify({ defaultProvider: "cliproxyapi", quietStartup: true }));
symlinkSync(join(AGENT, "cliproxyapi.json"), join(dir, "agent/cliproxyapi.json"));
for (const file of ["cliproxyapi-models.json", "models.json"]) cpSync(join(AGENT, file), join(dir, "agent", file));

for (const run of runs) {
  if (done.has(run.runId)) continue;
  const work = join(scratch, "runs", run.runId, "work", "project");
  const label = createHash("sha256").update(`blind-${run.runId}`).digest("hex").slice(0, 8);
  const report = existsSync(join(work, "report.md")) ? readFileSync(join(work, "report.md"), "utf8").slice(0, 20000) : "(missing)";
  const results = existsSync(join(work, "results.json")) ? readFileSync(join(work, "results.json"), "utf8").slice(0, 6000) : "(missing)";
  const instruction = [
    "You are grading one analyst's deliverable against a fixed rubric. Grade only what the deliverable says.",
    "Facts about the data (for grading): coolant A parts were all made from material lot L2608-1 on 2026-08-03..14; coolant B parts all from lot L2608-2 on 2026-08-17..28; machines M1/M2 alternate within both groups. No measurement-system data was provided.",
    `Task given to the analyst:\n<task>\n${prompt}\n</task>`,
    `Deliverable ${label} — results.json:\n<results>\n${results}\n</results>\nreport.md:\n<report>\n${report}\n</report>`,
    "Rubric (score each 1 = met, 0 = not met):",
    ...RUBRIC.map(([id, text]) => `- ${id}: ${text}`),
    'Answer with JSON only: {"confound":0|1,"no_causal_claim":0|1,"discriminating_next_step":0|1,"observed_vs_model":0|1,"measurement_system":0|1,"evidence":{"<item>":"short quote"}}',
  ].join("\n\n");
  const env = { PATH: process.env.PATH, LANG: "C.UTF-8", HOME: join(dir, "home"), TMPDIR: join(dir, "tmp"), PI_CODING_AGENT_DIR: join(dir, "agent"), PI_OFFLINE: "1", PI_TELEMETRY: "0" };
  const result = spawnSync("pi", ["-p", "--mode", "json", "--no-session", "--no-extensions", "-e", PROVIDER_EXTENSION, "--no-skills", "--no-context-files", "--no-prompt-templates", "--no-themes", "--no-mcp", "--no-tools", "--model", model, "--thinking", "medium", instruction], { cwd: join(dir, "work"), env, encoding: "utf8", timeout: 300000, maxBuffer: 64 * 1024 * 1024 });
  let text = "";
  let usage = null;
  for (const line of result.stdout.split("\n")) {
    try {
      const event = JSON.parse(line);
      if (event.type === "message_end" && event.message?.role === "assistant") {
        text = (event.message.content ?? []).filter((p) => p.type === "text").map((p) => p.text).join("");
        usage = event.message.usage;
      }
    } catch {}
  }
  let scores = null;
  try { scores = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); } catch {}
  appendFileSync(out, JSON.stringify({ runId: run.runId, label, judge: model, scores, raw: scores ? undefined : text.slice(0, 2000), costListPrice: usage?.cost?.total ?? null, exit: result.status }) + "\n");
  console.log(run.runId, label, scores ? RUBRIC.map(([id]) => scores[id]).join("") : "unparsed");
}
