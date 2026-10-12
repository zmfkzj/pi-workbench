// jobs/profile08.js
import { log } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  log("error", "profile expired", { id });
  {
    const log = (level, message) => out.push(`local ${level} ${message}`);
    log("info", "local only");
    log("warn", `items ${input.items.length}`);
  }
  log("debug", "profile retried", { out: out.length });
  return out;
}
