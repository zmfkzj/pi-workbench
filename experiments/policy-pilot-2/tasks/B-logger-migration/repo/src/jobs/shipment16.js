// jobs/shipment16.js
import { log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("info", "shipment retried", { id });
  const level = input.failed ? "error" : "info";
  log(level, "shipment rejected", { failed: Boolean(input.failed) });
  log("debug", "shipment skipped", { out: out.length });
  return out;
}
