"""Generate task B (logger migration): the starting repository and the reference solution.

Usage: python3 generate.py <out dir>  -> <out>/repo (start) and <out>/reference (migrated)
Deterministic: the same output on every run. The committed repo/ and reference.diff come from this script.
"""
import random
import shutil
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
rng = random.Random(20261012)
LEVELS = ["debug", "info", "warn", "error"]

LOG_JS = '''// Logging for all services. Sinks receive { level, message, context }.
export const LEVELS = ["debug", "info", "warn", "error"];
const sinks = [];

export function addSink(sink) {
  sinks.push(sink);
  return () => sinks.splice(sinks.indexOf(sink), 1);
}

function emit(level, message, context) {
  if (!LEVELS.includes(level)) throw new RangeError(`unknown level: ${level}`);
  for (const sink of sinks) sink({ level, message, context });
}

/** @deprecated since 4.0: use logger.<level>(message, context). Still exported for plugins outside this repository. */
export function log(level, message, context) {
  emit(level, message, context);
}

/** logger.debug/info/warn/error(message, context) */
export const logger = Object.freeze(Object.fromEntries(LEVELS.map((level) => [level, (message, context) => emit(level, message, context)])));
'''


class Call:
    """One call of the deprecated API: callee text, level expression, remaining args, layout."""

    def __init__(self, level, args, multiline=False, literal=True):
        self.level, self.args, self.multiline, self.literal = level, args, multiline, literal

    def old(self, callee, indent):
        level = f'"{self.level}"' if self.literal else self.level
        if self.multiline:
            inner = ",\n".join(f"{indent}  {a}" for a in [level, *self.args])
            return f"{callee}(\n{inner},\n{indent})"
        return f"{callee}({', '.join([level, *self.args])})"

    def new(self, target, indent):
        callee = f"{target}.{self.level}" if self.literal else f"{target}[{self.level}]"
        if self.multiline:
            inner = ",\n".join(f"{indent}  {a}" for a in self.args)
            return f"{callee}(\n{inner},\n{indent})"
        return f"{callee}({', '.join(self.args)})"


def message(words):
    return f'"{" ".join(words)}"'


VERBS = ["created", "updated", "skipped", "loaded", "flushed", "retried", "rejected", "queued", "expired", "synced"]
NOUNS = ["order", "invoice", "session", "report", "batch", "token", "shipment", "refund", "profile", "cache"]


def module(index, kind):
    """Return (path, old source, new source, preserved lines)."""
    noun = NOUNS[index % len(NOUNS)]
    name = f"{noun}{index:02d}"
    folder = "services" if index % 2 else "jobs"
    imp = "../log.js"
    preserved = []
    calls = []

    def call(level=None, extra=None, multiline=False, literal=True):
        level = level or rng.choice(LEVELS)
        args = [message([noun, rng.choice(VERBS)])] + ([extra] if extra else [])
        c = Call(level, args, multiline, literal)
        calls.append(c)
        return c

    body_old, body_new = [], []

    def stmt(c, indent="  ", callee="log", target="logger", prefix="", suffix=";"):
        body_old.append(f"{indent}{prefix}{c.old(callee, indent)}{suffix}")
        body_new.append(f"{indent}{prefix}{c.new(target, indent)}{suffix}")

    def same(line):
        body_old.append(line)
        body_new.append(line)

    callee, target = "log", "logger"
    import_old = f'import {{ log }} from "{imp}";'
    import_new = f'import {{ logger }} from "{imp}";'
    if kind == "alias":
        callee = rng.choice(["record", "write", "trace"])
        import_old = f'import {{ log as {callee} }} from "{imp}";'
    elif kind == "namespace":
        callee, target = "logging.log", "logging.logger"
        import_old = import_new = f'import * as logging from "{imp}";'
    elif kind == "mixed-import":
        import_old = f'import {{ LEVELS, log }} from "{imp}";'
        import_new = f'import {{ LEVELS, logger }} from "{imp}";'

    same(f"export function run(input) {{")
    same(f"  const id = input.id;")
    same(f"  const out = [];")
    stmt(call(extra="{ id }"), callee=callee, target=target)
    if kind in ("plain", "alias", "namespace", "mixed-import"):
        same(f"  for (const item of input.items) {{")
        stmt(call(level="debug", extra="{ item }"), indent="    ", callee=callee, target=target)
        same(f"    out.push(item * 2);")
        same(f"  }}")
    if kind in ("plain", "multiline", "mixed-import"):
        same(f"  if (out.length > 2) {{")
        stmt(call(level="warn", extra="{ count: out.length, id }", multiline=True), indent="    ", callee=callee, target=target)
        same(f"  }}")
    if kind in ("computed", "mixed-import"):
        same(f"  const level = input.failed ? \"error\" : \"info\";")
        stmt(call(level="level", extra="{ failed: Boolean(input.failed) }", literal=False), callee=callee, target=target)
    if kind == "mixed-import":
        same(f"  out.push(LEVELS.length);")
    if kind in ("ternary", "plain"):
        ok, bad = call(level="info"), call(level="error", extra="{ id }")
        body_old.append(f"  input.ok ? {ok.old(callee, '  ')} : {bad.old(callee, '  ')};")
        body_new.append(f"  input.ok ? {ok.new(target, '  ')} : {bad.new(target, '  ')};")
    if kind == "arrow":
        c = call(level="info", extra="{ value }")
        body_old.append(f"  input.items.forEach((value) => {c.old(callee, '  ')});")
        body_new.append(f"  input.items.forEach((value) => {c.new(target, '  ')});")
    if kind == "shadow-param":
        same(f"  out.push(...forward((level, message) => out.push(`${{level}}:${{message}}`), input.items));")
    if kind == "shadow-local":
        same(f"  {{")
        same(f"    const log = (level, message) => out.push(`local ${{level}} ${{message}}`);")
        same(f"    log(\"info\", \"local only\");")
        same(f"    log(\"warn\", `items ${{input.items.length}}`);")
        same(f"  }}")
        preserved += ['    log("info", "local only");', '    log("warn", `items ${input.items.length}`);']
    if kind == "member":
        same(f"  const audit = {{ entries: [], log(level, message) {{ this.entries.push([level, message]); }} }};")
        same(f"  audit.log(\"info\", \"member call, not the logger\");")
        same(f"  out.push(audit.entries.length);")
        preserved += ['  audit.log("info", "member call, not the logger");']
    if kind in ("strings", "plain"):
        text = f'  const hint = "replace log(\\"info\\", msg) calls in {name}";'
        comment = f'  // log("debug", "example") is the old form; see README.'
        same(comment)
        same(text)
        same(f"  out.push(hint.length);")
        preserved += [comment, text]
    stmt(call(level="debug", extra="{ out: out.length }"), callee=callee, target=target)
    same(f"  return out;")
    same(f"}}")

    extra_old, extra_new = [], []
    if kind == "shadow-param":
        fwd = [
            "/** Forward items to a caller-supplied sink with the same signature as the old log(). */",
            "export function forward(log, items) {",
            "  const seen = [];",
            "  for (const item of items) {",
            '    log("debug", `item ${item}`);',
            "    seen.push(item);",
            "  }",
            '  log("info", "forwarded");',
            "  return seen;",
            "}",
        ]
        extra_old += fwd
        extra_new += fwd
        preserved += ['    log("debug", `item ${item}`);', '  log("info", "forwarded");']

    header = f"// {folder}/{name}.js"
    old = "\n".join([header, import_old, "", *extra_old, *([""] if extra_old else []), *body_old, ""])
    new = "\n".join([header, import_new, "", *extra_new, *([""] if extra_new else []), *body_new, ""])
    return f"src/{folder}/{name}.js", old, new, preserved


KINDS = ["plain", "alias", "namespace", "multiline", "computed", "ternary", "arrow", "shadow-param", "shadow-local", "member", "strings", "mixed-import"]


def build():
    modules = []
    kinds = KINDS * 2
    for index, kind in enumerate(kinds):
        modules.append((kind, *module(index, kind)))
    return modules


def write(root, modules, which):
    if root.exists():
        shutil.rmtree(root)
    (root / "src").mkdir(parents=True)
    (root / "test").mkdir()
    (root / "src/log.js").write_text(LOG_JS)
    names = []
    for kind, path, old, new, _ in modules:
        (root / path).parent.mkdir(parents=True, exist_ok=True)
        (root / path).write_text(old if which == "old" else new)
        names.append(path)
    index = "\n".join(f'export {{ run as {Path(p).stem} }} from "./{p[4:]}";' for p in names) + "\n"
    (root / "src/index.js").write_text(index)
    (root / "package.json").write_text('{\n  "name": "ops-services",\n  "version": "4.0.0",\n  "private": true,\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n')
    (root / "README.md").write_text(
        "# ops-services\n\nService and job modules. Each exports `run(input)`; `src/index.js` lists them.\n\n"
        "Logging goes through `src/log.js`. Since 4.0 the API is `logger.debug/info/warn/error(message, context)`; "
        "`log(level, message, context)` is deprecated and kept only for plugins outside this repository.\n")
    (root / "test/smoke.test.js").write_text(
        'import assert from "node:assert/strict";\nimport test from "node:test";\nimport * as modules from "../src/index.js";\nimport { addSink } from "../src/log.js";\n\n'
        'test("every module runs and logs", () => {\n  const events = [];\n  const remove = addSink((event) => events.push(event));\n'
        '  for (const run of Object.values(modules)) run({ id: 1, items: [1, 2, 3], ok: true, failed: false });\n  remove();\n'
        '  assert.ok(events.length > 0);\n});\n')


if __name__ == "__main__":
    modules = build()
    write(OUT / "repo", modules, "old")
    write(OUT / "reference", modules, "new")
    preserved = {path: lines for _, path, _, _, lines in modules if lines}
    import json
    (OUT / "preserved.json").write_text(json.dumps(preserved, indent=1) + "\n")
    calls = sum(old.count("log(") for _, _, old, _, _ in modules)
    print(f"{len(modules)} modules")
