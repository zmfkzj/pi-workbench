import { writeCsv } from "./csv.js";
import { formatAmount } from "./amount.js";

/** Render a ledger as "csv" (rows plus a TOTAL row) or "json" ({ locale, records, total } in cents). */
export function renderExport(ledger, { format = "csv" } = {}) {
  const total = ledger.records.reduce((sum, record) => sum + record.amount, 0);
  if (format === "json") return JSON.stringify({ locale: ledger.locale, records: ledger.records, total }, null, 2) + "\n";
  if (format !== "csv") throw new RangeError(`unknown format: ${format}`);
  const amount = (cents) => formatAmount(cents, { locale: ledger.locale });
  return writeCsv([
    ["date", "account", "description", "amount"],
    ...ledger.records.map((r) => [r.date, r.account, r.description, amount(r.amount)]),
    ["", "", "TOTAL", amount(total)],
  ]);
}
