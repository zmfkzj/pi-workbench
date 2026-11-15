// Event accounting for the routing-selection measurement: turns Pi's JSON events (print mode, `--mode json`) of one run
// into what the model actually opened. Pure functions without I/O so tests can replay recorded events
// (experiments/routing-selection/observe.test.mjs).
//
// A call counts only from its `tool_execution_end` (paired with its start by `toolCallId`) and only when it did not end
// in an error: a failed read of a wrong path is an invalid-path attempt, not an opened file. A grep counts as index use
// only when its successful result returns lines of the research index, so a grep that matches nothing or searches a
// directory without the index is not index use.
import { relative, resolve } from "node:path";

export const INDEX_SUFFIX = "research-agent-skills/references/catalog.md";
const PATH_TOOLS = new Set(["read", "grep", "find", "ls"]);

/**
 * Classify an absolute path inside a variant's package: routing skill, catalog skill, research specialist, research
 * index, a directly exposed wrapper skill, another bundled SKILL.md or another package file. Null outside the package.
 * @param {string} path absolute path
 * @param {{ dir: string, catalog: { skills: { id: string, path: string }[] } }} pkg
 */
export function classify(path, pkg) {
  const rel = relative(pkg.dir, path);
  if (!rel || rel.startsWith("..") || resolve(pkg.dir, rel) !== resolve(path)) return null;
  const posix = rel.replaceAll("\\", "/");
  const router = /^skills\/wb-([a-z]+)\/SKILL\.md$/.exec(posix);
  if (router) return { router: router[1] };
  const wrapper = /^skills\/([\w-]+)\/SKILL\.md$/.exec(posix);
  if (wrapper) return { wrapper: wrapper[1] };
  const skill = pkg.catalog.skills.find((s) => s.path === posix);
  if (skill) return { skill: skill.id };
  const specialist = /^vendor\/research-agent-skills\/skills\/([\w-]+)\/SKILL\.md$/.exec(posix);
  if (specialist) return { specialist: specialist[1] };
  if (posix.endsWith(INDEX_SUFFIX)) return { researchIndex: true };
  // A bundled SKILL.md outside this variant's catalog (for example a child skill reached through a link): its directory name.
  const bundled = /^vendor\/.+\/([\w-]+)\/SKILL\.md$/.exec(posix);
  if (bundled) return { skill: bundled[1], uncatalogued: true };
  return { other: posix };
}

/** The text of a tool result (`{ content: [{ type: "text", text }] }`), or "". */
export function resultText(result) {
  if (typeof result === "string") return result;
  return (result?.content ?? []).filter((part) => part?.type === "text").map((part) => part.text ?? "").join("\n");
}

/** Pi's path argument resolution (path-utils resolveToCwd): `~` is HOME, relative paths resolve against the cwd. */
export function resolvePath(value, cwd, home) {
  const text = String(value ?? "").replace(/^@/, "");
  if (text === "~") return home;
  if (text.startsWith("~/")) return resolve(home, text.slice(2));
  return resolve(cwd, text || ".");
}

/**
 * Whether a successful grep result returned lines of the research index: the index itself was the search path and
 * something matched, or a directory containing it was searched and a result line names it.
 */
export function grepReturnedIndex(searchPath, text, pkgDir) {
  if (/^No matches found/.test(text.trim())) return false;
  const index = resolve(pkgDir, "vendor/research-agent-skills/skills", INDEX_SUFFIX);
  if (resolve(searchPath) === index) return text.trim().length > 0;
  const rel = relative(searchPath, index).replaceAll("\\", "/");
  if (!rel || rel.startsWith("..")) return false;
  return text.split("\n").some((line) => line.startsWith(`${rel}:`) || line.startsWith(`${rel}-`));
}

/**
 * Accumulates one run's events.
 * @param {{ pkg: { dir: string, catalog: any }, cwd: string, home: string, mask?: (text: string) => string }} options
 */
export function createObserver({ pkg, cwd, home, mask = (text) => text }) {
  /** @type {Map<string, { toolName: string, args: any }>} */
  const pending = new Map();
  const opened = [];
  const calls = [];
  const invalidPaths = [];
  const failedCalls = [];
  const written = [];
  let toolStarts = 0, indexGreps = 0, indexGrepAttempts = 0, archifyCommands = 0, finalizePassed = 0, finalizeFailed = 0;
  const usage = { messages: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, costMissing: 0, firstPromptTokens: /** @type {number | null} */ (null) };
  let finalText = "", error = /** @type {string | null} */ (null);

  /** @param {any} event */
  function handle(event) {
    if (event?.type === "tool_execution_start") {
      toolStarts++;
      pending.set(event.toolCallId, { toolName: event.toolName, args: event.args ?? {} });
      const shown = event.toolName === "bash" ? event.args?.command : (event.args?.path ?? event.args?.file_path ?? event.args?.pattern);
      calls.push(`${event.toolName} ${mask(String(shown ?? "")).replace(/\s+/g, " ").slice(0, 200)}`);
      return;
    }
    if (event?.type === "tool_execution_end") {
      const start = pending.get(event.toolCallId);
      pending.delete(event.toolCallId);
      const toolName = event.toolName ?? start?.toolName;
      const args = start?.args ?? {};
      const text = resultText(event.result);
      const rawPath = args.path ?? args.file_path;
      const path = PATH_TOOLS.has(toolName) || toolName === "write" || toolName === "edit" ? resolvePath(rawPath, cwd, home) : null;
      if (event.isError) {
        failedCalls.push(`${toolName} ${mask(String(rawPath ?? args.command ?? "")).slice(0, 200)}`);
        if (PATH_TOOLS.has(toolName) && /not found|ENOENT|no such file|EACCES|is a directory|ENOTDIR/i.test(text)) invalidPaths.push(mask(path ?? String(rawPath)));
        if (toolName === "bash" && /archify\.mjs/.test(args.command ?? "")) noteArchify(args.command, text);
        return;
      }
      if (toolName === "read" && path) {
        const c = classify(path, pkg);
        if (c) opened.push(c);
      }
      if (toolName === "grep" && path) {
        const rel = relative(pkg.dir, path);
        const insidePkg = !rel.startsWith("..");
        const index = resolve(pkg.dir, "vendor/research-agent-skills/skills", INDEX_SUFFIX);
        if (insidePkg && (path === index || !relative(path, index).startsWith(".."))) indexGrepAttempts++;
        if (grepReturnedIndex(path, text, pkg.dir)) indexGreps++;
      }
      if ((toolName === "write" || toolName === "edit") && path) written.push(mask(path));
      if (toolName === "bash" && /archify\.mjs/.test(args.command ?? "")) noteArchify(args.command, text);
      return;
    }
    if (event?.type === "message_end" && event.message?.role === "assistant") {
      const u = event.message.usage;
      usage.messages++;
      if (u) {
        usage.input += u.input ?? 0;
        usage.output += u.output ?? 0;
        usage.cacheRead += u.cacheRead ?? 0;
        usage.cacheWrite += u.cacheWrite ?? 0;
        if (usage.firstPromptTokens === null) usage.firstPromptTokens = (u.input ?? 0) + (u.cacheRead ?? 0) + (u.cacheWrite ?? 0);
      }
      if (typeof u?.cost?.total === "number") usage.cost += u.cost.total;
      else usage.costMissing++;
      if (event.message.errorMessage) error = event.message.errorMessage;
      const textOut = (event.message.content ?? []).filter((p) => p.type === "text").map((p) => p.text).join("");
      if (textOut.trim()) finalText = textOut;
    }
  }

  function noteArchify(command, text) {
    archifyCommands++;
    if (/\bfinalize\b/.test(command)) {
      if (/^finalize pass\b/m.test(text)) finalizePassed++;
      else finalizeFailed++;
    }
  }

  /** @param {{ profiles: string[], skills: string[], specialist?: string, avoidSkills?: string[] }} request */
  function summary(request) {
    const routers = opened.filter((o) => o.router).map((o) => o.router);
    const skills = opened.filter((o) => o.skill).map((o) => o.skill);
    const specialists = opened.filter((o) => o.specialist).map((o) => o.specialist);
    const wrappers = opened.filter((o) => o.wrapper).map((o) => o.wrapper);
    const reached = new Set([...skills, ...specialists]);
    return {
      routers, skills, specialists, wrappers,
      researchIndexRead: opened.some((o) => o.researchIndex),
      researchIndexGrep: indexGreps > 0,
      researchIndexGrepAttempts: indexGrepAttempts,
      researchIndex: opened.some((o) => o.researchIndex) || indexGreps > 0,
      otherFiles: opened.filter((o) => o.other).map((o) => o.other),
      routerHit: routers.some((p) => request.profiles.includes(p)),
      primaryRouterHit: request.profiles.length ? routers.includes(request.profiles[0]) : false,
      skillHit: request.skills.length ? request.skills.some((s) => reached.has(s)) : null,
      specialistHit: request.specialist ? specialists.includes(request.specialist) : null,
      avoidedSkillOpened: (request.avoidSkills ?? []).filter((s) => reached.has(s)),
      invalidPaths, failedCalls, written,
      archifyCommands, finalizePassed, finalizeFailed,
      toolCalls: toolStarts, unfinishedCalls: pending.size, calls,
      usage, cost: usage.cost, costMissing: usage.costMissing > 0, error,
      finalText,
    };
  }

  return { handle, summary, get cost() { return usage.cost; }, get toolStarts() { return toolStarts; } };
}
