// Amounts are integers in minor units (cents). Every reader and writer goes through these two functions.

const PREFIX = /^(?:[$€£₩]|USD|EUR|GBP|KRW)\s*/i;
const SEPARATORS = { en: { group: ",", decimal: "." }, de: { group: ".", decimal: "," } };

/**
 * Parse an amount as written in ledger files: optional currency prefix, grouping separators, up to two decimals,
 * negatives as "-12.00", "−12.00" (U+2212) or "(12.00)". The locale decides which separator is which.
 * Throws RangeError for anything else.
 */
export function parseAmount(text, { locale = "en" } = {}) {
  const separators = SEPARATORS[locale];
  if (!separators) throw new RangeError(`unknown locale: ${locale}`);
  if (typeof text !== "string") throw new RangeError(`invalid amount: ${JSON.stringify(text)}`);
  let value = text.trim().replace(/\u2212/g, "-");
  let negative = false;
  if (value.startsWith("(") && value.endsWith(")")) {
    negative = true;
    value = value.slice(1, -1).trim();
  }
  if (value.startsWith("-")) {
    negative = !negative;
    value = value.slice(1).trim();
  }
  value = value.replace(PREFIX, "");
  const g = `\\${separators.group}`;
  const d = `\\${separators.decimal}`;
  if (!new RegExp(`^(?:\\d{1,3}(?:${g}\\d{3})+|\\d+)(?:${d}\\d{1,2})?$`).test(value)) {
    throw new RangeError(`invalid amount: ${JSON.stringify(text)}`);
  }
  const [whole, fraction = ""] = value.split(separators.group).join("").split(separators.decimal);
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

/** Format cents for output in the given locale, e.g. 123456 -> "1,234.56" (en) or "1.234,56" (de). */
export function formatAmount(cents, { locale = "en" } = {}) {
  const separators = SEPARATORS[locale];
  if (!separators) throw new RangeError(`unknown locale: ${locale}`);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, separators.group);
  return `${sign}${whole}${separators.decimal}${String(abs % 100).padStart(2, "0")}`;
}
