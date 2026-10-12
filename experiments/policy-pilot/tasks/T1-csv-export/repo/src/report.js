/** Totals for a list of sales records: { id, region, customer, amount, note }. */
export function summarize(records) {
  const byRegion = {};
  let total = 0;
  for (const record of records) {
    const amount = Number(record.amount) || 0;
    total += amount;
    byRegion[record.region] = (byRegion[record.region] ?? 0) + amount;
  }
  return { count: records.length, total, byRegion };
}

export function formatJson(summary) {
  return JSON.stringify(summary, null, 2);
}
