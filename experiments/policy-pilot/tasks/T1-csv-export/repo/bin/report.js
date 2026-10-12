#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { formatJson, summarize } from "../src/report.js";

const [path] = process.argv.slice(2);
if (!path) {
  console.error("usage: report.js <records.json>");
  process.exit(2);
}
const records = JSON.parse(readFileSync(path, "utf8"));
console.log(formatJson(summarize(records)));
