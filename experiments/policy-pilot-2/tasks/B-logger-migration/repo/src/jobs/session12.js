// jobs/session12.js
import { log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("error", "session queued", { id });
  for (const item of input.items) {
    log("debug", "session updated", { item });
    out.push(item * 2);
  }
  if (out.length > 2) {
    log(
      "warn",
      "session flushed",
      { count: out.length, id },
    );
  }
  input.ok ? log("info", "session expired") : log("error", "session created", { id });
  // log("debug", "example") is the old form; see README.
  const hint = "replace log(\"info\", msg) calls in session12";
  out.push(hint.length);
  log("debug", "session rejected", { out: out.length });
  return out;
}
