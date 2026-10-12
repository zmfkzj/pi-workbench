// jobs/batch14.js
import * as logging from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  logging.log("info", "batch created", { id });
  for (const item of input.items) {
    logging.log("debug", "batch updated", { item });
    out.push(item * 2);
  }
  logging.log("debug", "batch retried", { out: out.length });
  return out;
}
