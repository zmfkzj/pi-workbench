import { readLedger } from "./read.js";
import { renderExport } from "./export.js";

/**
 * Programmatic entry point used by the reporting service.
 * options.format: "csv" (default) or "json".
 */
export function exportFile(path, options = {}) {
  return renderExport(readLedger(path), options);
}
