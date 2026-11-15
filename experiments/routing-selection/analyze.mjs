// Summarise routing-selection records: per model and variant, every attempt (finished, stopped or failed), how often a
// finished run opened an acceptable routing skill, the primary one, an acceptable bundled skill, the expected research
// specialist and the research index (read or a grep that returned its lines), wrong-path attempts, negative requests
// that opened a skill they should not, prompt tokens of the first model call and cost; then per request side by side.
// Records written before the event-accounting fix (no `usage` field) classified reads at their start, so their
// counts may include failed reads; they are labelled "start-time".
// Usage: node experiments/routing-selection/analyze.mjs results/*.jsonl [--stage NAME] [--requests id,id]
import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const option = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };
const files = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")));
const stageFilter = option("stage");
const requestFilter = option("requests") ? new Set(option("requests").split(",")) : null;
const records = files.flatMap((file) => readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)))
  .filter((r) => (!stageFilter || r.stage === stageFilter) && (!requestFilter || requestFilter.has(r.request)));
const finished = (r) => r.exit === 0 && !r.error && !r.stop;
const group = (items, key) => items.reduce((m, r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]), new Map());
const rate = (items, test) => `${items.filter(test).length}/${items.length}`;
const mean = (values) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : "-");
const cost = (items) => items.reduce((n, r) => n + (r.cost ?? 0), 0);

console.log(`records ${records.length}, finished ${records.filter(finished).length}, cost $${cost(records).toFixed(3)}${records.some((r) => r.costMissing) ? " (some costs missing)" : ""}`);
for (const [model, items] of group(records, (r) => `${r.model}:${r.thinking}`)) {
  console.log(`\n## ${model}`);
  console.log("| variant | attempts (stopped/failed) | router | primary router | skill | specialist | research index (read / grep) | wrong-path calls | negatives opening an avoided skill | Archify finalize pass (last receipt) | first prompt tokens | cost |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const [variant, all] of group(items, (r) => r.variant)) {
    const runs = all.filter(finished);
    const accounting = all.some((r) => !r.usage) ? " (start-time)" : "";
    const positives = runs.filter((r) => r.skillHit !== null && r.skillHit !== undefined && !r.negative);
    const research = runs.filter((r) => r.specialistHit !== null && r.specialistHit !== undefined);
    const negatives = runs.filter((r) => r.negative);
    const archify = runs.filter((r) => r.finalizeReceipts?.length || r.archifyCommands);
    const finalized = (r) => (r.finalizeReceiptPass ?? null) !== null ? r.finalizeReceiptPass : r.finalizePassed > 0;
    console.log(`| ${variant}${accounting} | ${all.length} (${all.filter((r) => r.stop).length}/${all.filter((r) => r.exit !== 0 || r.error).length}) | ${rate(runs, (r) => r.routerHit)} | ${rate(runs, (r) => r.primaryRouterHit)} | ${rate(positives, (r) => r.skillHit)} | ${rate(research, (r) => r.specialistHit)} | ${rate(runs, (r) => r.researchIndex)} (${runs.filter((r) => r.researchIndexRead).length} / ${runs.filter((r) => r.researchIndexGrep).length}) | ${runs.reduce((n, r) => n + (r.invalidPaths?.length ?? 0), 0)} in ${rate(runs, (r) => r.invalidPaths?.length)} | ${negatives.length ? rate(negatives, (r) => r.avoidedSkillOpened?.length) : "-"} | ${archify.length ? `${archify.filter(finalized).length}/${archify.length} runs` : "-"} | ${mean(runs.map((r) => r.usage?.firstPromptTokens).filter((n) => typeof n === "number"))} | $${cost(all).toFixed(3)} |`);
  }
  const variants = [...group(items, (r) => r.variant).keys()];
  console.log(`\n| request | ${variants.map((v) => `${v} router / skill / specialist / index`).join(" | ")} |`);
  console.log(`|---|${variants.map(() => "---").join("|")}|`);
  for (const [request, all] of group(items, (r) => r.request)) {
    const runs = all.filter(finished);
    const cells = variants.map((v) => {
      const x = runs.filter((r) => r.variant === v);
      const skill = x[0]?.negative ? `avoid ${rate(x, (r) => !r.avoidedSkillOpened?.length)}` : rate(x, (r) => r.skillHit);
      const specialist = x.some((r) => r.specialistHit !== null && r.specialistHit !== undefined) ? rate(x, (r) => r.specialistHit) : "-";
      return `${rate(x, (r) => r.routerHit)} / ${skill} / ${specialist} / ${rate(x, (r) => r.researchIndex)}`;
    });
    console.log(`| ${request} | ${cells.join(" | ")} |`);
  }
}
