// services/invoice11.js
import { LEVELS, log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("info", "invoice rejected", { id });
  for (const item of input.items) {
    log("debug", "invoice retried", { item });
    out.push(item * 2);
  }
  if (out.length > 2) {
    log(
      "warn",
      "invoice synced",
      { count: out.length, id },
    );
  }
  const level = input.failed ? "error" : "info";
  log(level, "invoice expired", { failed: Boolean(input.failed) });
  out.push(LEVELS.length);
  log("debug", "invoice skipped", { out: out.length });
  return out;
}
