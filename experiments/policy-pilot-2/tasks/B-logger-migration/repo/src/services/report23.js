// services/report23.js
import { LEVELS, log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("info", "report rejected", { id });
  for (const item of input.items) {
    log("debug", "report created", { item });
    out.push(item * 2);
  }
  if (out.length > 2) {
    log(
      "warn",
      "report queued",
      { count: out.length, id },
    );
  }
  const level = input.failed ? "error" : "info";
  log(level, "report synced", { failed: Boolean(input.failed) });
  out.push(LEVELS.length);
  log("debug", "report created", { out: out.length });
  return out;
}
