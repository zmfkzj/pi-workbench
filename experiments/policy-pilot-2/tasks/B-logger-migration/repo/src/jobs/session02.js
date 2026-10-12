// jobs/session02.js
import * as logging from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  logging.log("info", "session loaded", { id });
  for (const item of input.items) {
    logging.log("debug", "session expired", { item });
    out.push(item * 2);
  }
  logging.log("debug", "session expired", { out: out.length });
  return out;
}
