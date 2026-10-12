// Strict unified-diff application for reviewed corrections to vendored upstream files.
//
// A patch lists file paths relative to the upstream repository (`a/<path>`, `b/<path>`). Every hunk must match
// at exactly its recorded line numbers: no fuzz, no offset, so a missing, duplicated or stale patch fails instead
// of being applied somewhere else. Used by `scripts/vendor_sources.py` after an upstream fetch (`apply`) and by
// `scripts/check.mjs` to reconstruct and verify the upstream bytes of every corrected file (`reverse`).
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HUNK = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

function stripPrefix(header) {
  const path = header.replace(/\t.*$/, "");
  if (!path.startsWith("a/") && !path.startsWith("b/")) throw new Error(`Patch path needs an a/ or b/ prefix: ${header}`);
  const relative = path.slice(2);
  if (!relative || relative.startsWith("/") || relative.split("/").includes("..")) throw new Error(`Unsafe patch path: ${header}`);
  return relative;
}

/** Parse a unified diff (plain or `git diff` output) into [{ path, hunks }]. */
export function parsePatch(text) {
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  const files = [];
  let file = null;
  let hunk = null;
  let remaining = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (hunk && (remaining.old > 0 || remaining.new > 0)) {
      const op = line[0];
      if (op !== " " && op !== "-" && op !== "+") throw new Error(`Malformed hunk line ${i + 1} in patch for ${file.path}`);
      hunk.lines.push({ op, text: line.slice(1) });
      if (op !== "+") remaining.old--;
      if (op !== "-") remaining.new--;
      if (remaining.old < 0 || remaining.new < 0) throw new Error(`Hunk longer than its header at line ${i + 1} (${file.path})`);
      continue;
    }
    if (line.startsWith("\\ ")) {
      const last = hunk?.lines.at(-1);
      if (!last) throw new Error(`Unexpected end-of-file marker at line ${i + 1}`);
      if (last.op !== "+") hunk.oldNoEol = true;
      if (last.op !== "-") hunk.newNoEol = true;
      continue;
    }
    if (line.startsWith("--- ")) {
      if (!lines[i + 1]?.startsWith("+++ ")) throw new Error(`Missing +++ header after line ${i + 1}`);
      const from = stripPrefix(line.slice(4));
      const to = stripPrefix(lines[++i].slice(4));
      if (from !== to) throw new Error(`Renames are not supported: ${from} -> ${to}`);
      if (files.some((f) => f.path === to)) throw new Error(`File patched twice in one patch: ${to}`);
      file = { path: to, hunks: [] };
      files.push(file);
      hunk = null;
      continue;
    }
    const match = HUNK.exec(line);
    if (match) {
      if (!file) throw new Error(`Hunk before file header at line ${i + 1}`);
      const count = (value) => (value === undefined ? 1 : Number(value));
      hunk = { oldStart: Number(match[1]), oldLines: count(match[2]), newStart: Number(match[3]), newLines: count(match[4]), lines: [], oldNoEol: false, newNoEol: false };
      remaining = { old: hunk.oldLines, new: hunk.newLines };
      file.hunks.push(hunk);
      continue;
    }
    if (hunk && remaining.old === 0 && remaining.new === 0 && !/^(diff |index |new file|deleted file|similarity|rename |old mode|new mode)/.test(line)) {
      throw new Error(`Unexpected line ${i + 1} after a complete hunk (${file.path})`);
    }
  }
  if (hunk && (remaining.old > 0 || remaining.new > 0)) throw new Error(`Truncated hunk in patch for ${file.path}`);
  if (!files.length || files.some((f) => !f.hunks.length)) throw new Error("Patch has no file or a file without hunks");
  return files;
}

/** Apply one parsed file patch to text; `reverse` turns the corrected text back into the original. */
export function applyFilePatch(text, filePatch, { reverse = false } = {}) {
  const content = text.split("\n");
  let eol = content.at(-1) === "";
  if (eol) content.pop();
  const out = [];
  let cursor = 0;
  for (const hunk of filePatch.hunks) {
    const [fromOp, toOp] = reverse ? ["+", "-"] : ["-", "+"];
    const start = reverse ? hunk.newStart : hunk.oldStart;
    const count = reverse ? hunk.newLines : hunk.oldLines;
    const expected = hunk.lines.filter((l) => l.op !== toOp).map((l) => l.text);
    const replacement = hunk.lines.filter((l) => l.op !== fromOp).map((l) => l.text);
    const index = count === 0 ? start : start - 1;
    if (index < cursor || index + expected.length > content.length) throw new Error(`Hunk @@ ${start} does not fit ${filePatch.path}`);
    for (let k = 0; k < expected.length; k++) {
      if (content[index + k] !== expected[k]) throw new Error(`Hunk @@ ${start} does not match ${filePatch.path} at line ${index + k + 1}`);
    }
    const [fromNoEol, toNoEol] = reverse ? [hunk.newNoEol, hunk.oldNoEol] : [hunk.oldNoEol, hunk.newNoEol];
    const touchesEnd = index + expected.length === content.length;
    if (touchesEnd && fromNoEol === eol) throw new Error(`End-of-file newline differs from the patch in ${filePatch.path}`);
    if (touchesEnd) eol = !toNoEol;
    out.push(...content.slice(cursor, index), ...replacement);
    cursor = index + expected.length;
  }
  out.push(...content.slice(cursor));
  return out.join("\n") + (eol && out.length ? "\n" : "");
}

export const digests = (data) => ({
  sha256: createHash("sha256").update(data).digest("hex"),
  bytes: data.length,
  gitBlob: createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex"),
});

/** Every patch of every source: [{ sourceId, patch, reason, files: [{ path, hunks }] }], in sources.json order. */
export async function readPatches(root, sources) {
  const result = [];
  for (const source of sources) {
    for (const entry of source.patches ?? []) {
      const files = parsePatch(await readFile(join(root, entry.file), "utf8"));
      result.push({ sourceId: source.id, patch: entry.file, reason: entry.reason, files: files.map((f) => ({ ...f, vendorPath: `vendor/${source.id}/${f.path}` })) });
    }
  }
  return result;
}

/**
 * Check every corrected file against its integrity entry: the distributed bytes match the corrected digests, the
 * reverse patch reproduces the recorded upstream bytes, and the forward patch reproduces the distributed bytes.
 * Returns a list of problems (empty when everything holds).
 */
export async function verifyPatches(root, sources, integrityFiles) {
  const problems = [];
  const entries = new Map(integrityFiles.map((f) => [f.path, f]));
  const patched = new Set();
  let patches;
  try {
    patches = await readPatches(root, sources);
  } catch (error) {
    return [`Cannot read patches: ${error.message}`];
  }
  for (const { patch, files } of patches) {
    for (const file of files) {
      const entry = entries.get(file.vendorPath);
      if (patched.has(file.vendorPath)) problems.push(`${file.vendorPath} is changed by more than one patch`);
      patched.add(file.vendorPath);
      if (!entry) { problems.push(`${patch} changes ${file.vendorPath}, which is not in the integrity manifest`); continue; }
      if (entry.patch !== patch || !entry.upstream) { problems.push(`${file.vendorPath} must record patch ${patch} and its upstream digests`); continue; }
      try {
        const current = await readFile(join(root, file.vendorPath));
        const original = applyFilePatch(current.toString("utf8"), file, { reverse: true });
        const upstream = digests(Buffer.from(original, "utf8"));
        for (const key of ["sha256", "bytes", "gitBlob"]) {
          if (upstream[key] !== entry.upstream[key]) problems.push(`${file.vendorPath}: reversing ${patch} does not reproduce the upstream ${key}`);
        }
        if (applyFilePatch(original, file) !== current.toString("utf8")) problems.push(`${file.vendorPath}: ${patch} does not reproduce the corrected file`);
      } catch (error) {
        problems.push(`${file.vendorPath}: ${error.message}`);
      }
    }
  }
  for (const entry of integrityFiles) {
    if ((entry.patch || entry.upstream) && !patched.has(entry.path)) problems.push(`${entry.path} records a patch that no listed patch changes`);
  }
  return problems;
}

// CLI used by vendor_sources.py: node scripts/vendor_patches.mjs apply <vendor source dir> <patch file>...
// Applies the patches in place and prints the changed paths (relative to the source dir) as JSON.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, directory, ...patchFiles] = process.argv.slice(2);
  if (command !== "apply" || !directory || !patchFiles.length) {
    console.error("usage: node scripts/vendor_patches.mjs apply <vendor source dir> <patch file>...");
    process.exit(2);
  }
  const changed = [];
  for (const patchFile of patchFiles) {
    for (const file of parsePatch(await readFile(patchFile, "utf8"))) {
      if (changed.includes(file.path)) throw new Error(`${file.path} is changed by more than one patch`);
      const target = join(directory, file.path);
      await writeFile(target, applyFilePatch(await readFile(target, "utf8"), file));
      changed.push(file.path);
    }
  }
  console.log(JSON.stringify(changed));
}
