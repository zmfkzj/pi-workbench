// jobs/order00.js
import { log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("error", "order created", { id });
  for (const item of input.items) {
    log("debug", "order created", { item });
    out.push(item * 2);
  }
  if (out.length > 2) {
    log(
      "warn",
      "order created",
      { count: out.length, id },
    );
  }
  input.ok ? log("info", "order created") : log("error", "order expired", { id });
  // log("debug", "example") is the old form; see README.
  const hint = "replace log(\"info\", msg) calls in order00";
  out.push(hint.length);
  log("debug", "order expired", { out: out.length });
  return out;
}
