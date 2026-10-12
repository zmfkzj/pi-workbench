#!/usr/bin/env node
// Dry-run probe: the simulated endpoint always fails, so the output shows how many attempts the settings allow.
import { readFileSync } from "node:fs";
import { parseConfig } from "../src/config.js";
import { resolveSettings, runProbe } from "../src/probe.js";

const args = process.argv.slice(2);
const index = args.indexOf("--config");
const config = index >= 0 ? parseConfig(readFileSync(args[index + 1], "utf8")) : {};
const settings = resolveSettings(config);
const result = await runProbe(settings, async () => false);
console.log(`url: ${settings.url}`);
console.log(`timeout_ms: ${settings.timeout_ms}`);
console.log(`attempts: ${result.attempts}`);
