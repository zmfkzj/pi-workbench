// services/cache19.js
import { log } from "../log.js";

/** Forward items to a caller-supplied sink with the same signature as the old log(). */
export function forward(log, items) {
  const seen = [];
  for (const item of items) {
    log("debug", `item ${item}`);
    seen.push(item);
  }
  log("info", "forwarded");
  return seen;
}

export function run(input) {
  const id = input.id;
  const out = [];
  log("debug", "cache created", { id });
  out.push(...forward((level, message) => out.push(`${level}:${message}`), input.items));
  log("debug", "cache retried", { out: out.length });
  return out;
}
