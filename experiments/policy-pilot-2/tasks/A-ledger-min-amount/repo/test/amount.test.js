import assert from "node:assert/strict";
import test from "node:test";
import { formatAmount, parseAmount } from "../src/amount.js";

test("parseAmount: en and de formats, prefixes and negatives", () => {
  assert.equal(parseAmount("$12,500.00"), 1250000);
  assert.equal(parseAmount("(84.20)"), -8420);
  assert.equal(parseAmount("−1000.00"), -100000);
  assert.equal(parseAmount("-7.5"), -750);
  assert.equal(parseAmount("€ 8.400,00", { locale: "de" }), 840000);
  assert.equal(parseAmount("(1.234,50)", { locale: "de" }), -123450);
  assert.throws(() => parseAmount("1,234.50", { locale: "de" }), RangeError);
  assert.throws(() => parseAmount("12.345"), RangeError);
});

test("formatAmount", () => {
  assert.equal(formatAmount(123456), "1,234.56");
  assert.equal(formatAmount(-123450, { locale: "de" }), "-1.234,50");
});
