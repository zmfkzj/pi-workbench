import { readFileSync } from "node:fs";
import { parseCsv } from "./csv.js";
import { parseAmount } from "./amount.js";

const COLUMNS = ["date", "account", "description", "amount"];

/**
 * Read a ledger file. An optional first line "#locale=de" selects the number format (default en).
 * Returns { locale, records: [{ date, account, description, amount }] } with amount in cents.
 */
export function readLedger(path) {
  let text = readFileSync(path, "utf8");
  let locale = "en";
  const directive = /^#locale=(\w+)\r?\n/.exec(text);
  if (directive) {
    locale = directive[1];
    text = text.slice(directive[0].length);
  }
  const [header, ...rows] = parseCsv(text).filter((row) => row.some((cell) => cell !== ""));
  if (header?.join(",") !== COLUMNS.join(",")) throw new Error(`${path}: expected header ${COLUMNS.join(",")}`);
  const records = rows.map((row, index) => {
    const [date, account, description, amount] = row;
    try {
      return { date, account, description, amount: parseAmount(amount, { locale }) };
    } catch (error) {
      throw new Error(`${path}: row ${index + 2}: ${error.message}`);
    }
  });
  return { locale, records };
}
