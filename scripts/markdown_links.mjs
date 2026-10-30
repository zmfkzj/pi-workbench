// Local targets of inline Markdown links, as scripts/check.mjs verifies them.
// A destination is either `<...>` (may contain spaces) or a run without whitespace, optionally followed by a title
// ("..." or '...'), as in CommonMark. Text such as `[2, 4](like in a/b.json)` is prose, not a link.

const DESTINATION = /^(?:<([^<>\n]*)>|([^\s<>]+))(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?$/;

/**
 * Package-relative link targets in `markdown` (fenced code removed, images, URLs with a scheme, absolute paths and
 * placeholders skipped, query and fragment stripped).
 * @param {string} markdown
 * @returns {string[]}
 */
export function localLinkTargets(markdown) {
  const body = markdown.replace(/```[\s\S]*?```/g, "");
  const targets = [];
  for (const match of body.matchAll(/(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
    const parsed = DESTINATION.exec(match[1].trim());
    if (!parsed) continue;
    const target = (parsed[1] ?? parsed[2]).split(/[?#]/)[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("/") || /[{}*<>]/.test(target)) continue;
    targets.push(target);
  }
  return targets;
}
