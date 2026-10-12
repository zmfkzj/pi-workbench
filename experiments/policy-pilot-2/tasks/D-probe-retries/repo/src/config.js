// Parser for the probe configuration format (see README.md, "Configuration files").

/** Convert one raw value: double-quoted string (with \" and \\ escapes), true/false, number, or bare string. */
export function parseValue(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) {
    let out = "";
    for (let i = 1; i < value.length; i++) {
      const char = value[i];
      if (char === "\\") {
        const next = value[++i];
        if (next !== '"' && next !== "\\") throw new SyntaxError(`invalid escape \\${next ?? ""} in ${value}`);
        out += next;
      } else if (char === '"') {
        if (value.slice(i + 1).trim() !== "") throw new SyntaxError(`unexpected text after string: ${value}`);
        return out;
      } else out += char;
    }
    throw new SyntaxError(`unterminated string: ${value}`);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

/** Parse "key: value" lines. Blank lines and lines starting with # are ignored. */
export function parseConfig(text) {
  const config = {};
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === "" || line.trim().startsWith("#")) return;
    const match = /^\s*([A-Za-z_][\w.]*)\s*:(.*)$/.exec(line);
    if (!match) throw new SyntaxError(`line ${index + 1}: expected "key: value"`);
    config[match[1]] = parseValue(match[2]);
  });
  return config;
}
