#!/usr/bin/env node
"use strict";
const { parseDuration, formatDuration } = require("../lib/duration.cjs");

const [text] = process.argv.slice(2);
if (!text) {
  console.error("usage: focus-timer <duration>   e.g. focus-timer 25m");
  process.exit(2);
}
try {
  const seconds = parseDuration(text);
  console.log(`timer set: ${formatDuration(seconds)} (${seconds} seconds)`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
