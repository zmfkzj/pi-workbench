#!/usr/bin/env node
import { exportFile } from "../src/api.js";

const USAGE = "usage: ledger export <file> [--format csv|json]";

function fail(message) {
  console.error(`error: ${message}`);
  console.error(USAGE);
  process.exit(2);
}

const [command, ...rest] = process.argv.slice(2);
if (command !== "export") fail(command ? `unknown command: ${command}` : "missing command");
const options = {};
let file;
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i];
  if (arg === "--format") {
    if (i + 1 >= rest.length) fail("--format needs a value");
    options.format = rest[++i];
  } else if (arg.startsWith("--")) {
    fail(`unknown option: ${arg}`);
  } else if (file === undefined) {
    file = arg;
  } else {
    fail(`unexpected argument: ${arg}`);
  }
}
if (!file) fail("missing file");
try {
  process.stdout.write(exportFile(file, options));
} catch (error) {
  fail(error.message);
}
