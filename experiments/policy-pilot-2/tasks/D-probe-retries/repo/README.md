# probe-runner

Health probes with retries. `node bin/probe.js --config <file>` is a dry run against an endpoint that always fails,
so it prints how many attempts a configuration allows.

## Configuration files

One `key: value` per line. Values are double-quoted strings (escape `"` and `\` with a backslash), `true`/`false`,
numbers, or bare text. `#` starts a comment when it is outside a quoted string and at the start of a line or after
whitespace; the comment runs to the end of the line. `#` inside a quoted string or directly after other text
(`tag: a#b`) is part of the value.

| Key | Default | Meaning |
|---|---|---|
| `url` | `http://localhost/health` | probe target |
| `retries` | `3` | retries after the first attempt (`0` = a single attempt); invalid values use the default |
| `timeout_ms` | `1000` | per-attempt timeout; invalid values use the default |
