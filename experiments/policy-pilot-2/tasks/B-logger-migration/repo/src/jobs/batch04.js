// jobs/batch04.js
import { log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("warn", "batch rejected", { id });
  const level = input.failed ? "error" : "info";
  log(level, "batch updated", { failed: Boolean(input.failed) });
  log("debug", "batch expired", { out: out.length });
  return out;
}
