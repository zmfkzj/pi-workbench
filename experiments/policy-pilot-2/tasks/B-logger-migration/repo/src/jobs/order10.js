// jobs/order10.js
import { log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("debug", "order created", { id });
  // log("debug", "example") is the old form; see README.
  const hint = "replace log(\"info\", msg) calls in order10";
  out.push(hint.length);
  log("debug", "order flushed", { out: out.length });
  return out;
}
