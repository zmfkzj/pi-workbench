// services/invoice01.js
import { log as trace } from "../log.js";

export function run(input) {
  const id = input.id;
  const out = [];
  trace("debug", "invoice loaded", { id });
  for (const item of input.items) {
    trace("debug", "invoice rejected", { item });
    out.push(item * 2);
  }
  trace("debug", "invoice created", { out: out.length });
  return out;
}
