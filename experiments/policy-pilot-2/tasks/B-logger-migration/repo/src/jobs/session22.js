// jobs/session22.js
import { log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("warn", "session created", { id });
  // log("debug", "example") is the old form; see README.
  const hint = "replace log(\"info\", msg) calls in session22";
  out.push(hint.length);
  log("debug", "session skipped", { out: out.length });
  return out;
}
