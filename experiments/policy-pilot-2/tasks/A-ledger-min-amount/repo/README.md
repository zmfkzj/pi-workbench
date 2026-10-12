# ledger-tools

Exports ledger files (CSV) as CSV with a total row, or as JSON.

```bash
node bin/ledger.js export data/q3-en.csv
node bin/ledger.js export data/q3-de.csv --format json
npm test
```

Programmatic use: `exportFile(path, { format })` from `src/api.js`.

## Ledger files

Columns `date,account,description,amount`. An optional first line `#locale=de` switches the amount format from
English (`1,234.56`) to German (`1.234,56`). Amounts may carry a currency prefix (`$`, `€`, `£`, `₩`, `USD`, `EUR`,
`GBP`, `KRW`) and negatives may be written `-12.00`, `−12.00` or `(12.00)`. Amounts are handled in cents internally.
