import { constants } from "node:fs";
import { access, readFile, realpath, stat } from "node:fs/promises";
import { delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const STATE_TYPE = "pi-workbench.state";
export const PROFILE_TYPE = "pi-workbench.profile";
/** Command output that version 0.1.0 stored as a model-visible message; requests leave it out. */
export const OUTPUT_TYPE = "pi-workbench.output";
/** Command output records: session entries shown in the transcript, never part of the model context. */
export const OUTPUT_ENTRY_TYPE = "pi-workbench.command-output";
export const SELECTED_SKILL_TYPE = "pi-workbench.selected-skill";
/** First words of every one-shot skill text the model receives. */
export const SKILL_MARKER = "Workbench one-shot skill selection:";
export const PROFILE_IDS = Object.freeze([
  "requirements", "game", "analysis", "vision", "manufacturing", "coding", "promo",
]);
const MODES = new Set(["auto", "off", ...PROFILE_IDS]);
const HELP = [
  "/workbench list [profile] — 스킬 목록",
  "/workbench use <profile|auto|off> — 현재 세션 분기의 프로필 선택",
  "/workbench skill <id> — 원본 스킬을 다음 사용자 요청 한 번에 붙이기 (작업 중에 보내는 steering·follow-up 포함)",
  "/workbench cancel [id] — 대기 중인 스킬 선택 취소 (id를 빼면 전부)",
  "/workbench status — 현재 프로필과 대기 중인 스킬 선택",
  "/workbench doctor — 실행파일·환경변수 존재 확인",
  `Profiles: ${PROFILE_IDS.join(", ")}`,
  "auto: 기본 스킬 탐색 사용. off: 프로필 안내 주입 끄기. 둘 다 설치된 스킬은 유지합니다.",
  "스킬 선택은 /reload, 분기 이동(/tree), 세션 전환 때 취소됩니다. 작업 중 대기열에 넣는 /skill:·프롬프트 템플릿 요청에는 붙일 수 없어 그때도 취소됩니다.",
].join("\n");

// Pi replaces everything after `/workbench ` with the chosen value, so each candidate is a whole argument string the handler accepts.
const SUBCOMMAND_COMPLETIONS = Object.freeze([
  { value: "list", label: "list [profile]", description: "스킬 목록" },
  { value: "use ", label: "use <profile|auto|off>", description: "현재 세션 분기의 프로필 선택" },
  { value: "skill ", label: "skill <id>", description: "원본 스킬을 다음 사용자 요청 한 번에 붙이기" },
  { value: "cancel", label: "cancel [id]", description: "대기 중인 스킬 선택 취소" },
  { value: "status", label: "status", description: "현재 프로필과 대기 중인 스킬 선택" },
  { value: "doctor", label: "doctor", description: "실행파일·환경변수 존재 확인" },
  { value: "help", label: "help", description: "도움말" },
]);

/** Subcommands whose argument comes from the catalog; `use auto` and `use off` need none. */
export const CATALOG_ARGUMENT_COMMANDS = Object.freeze(["list", "use", "skill"]);
/** Subcommands that take one argument: the catalog ones and `cancel`, whose argument is a pending selection. */
const ARGUMENT_COMMANDS = Object.freeze([...CATALOG_ARGUMENT_COMMANDS, "cancel"]);

const usableId = (id) => typeof id === "string" && /^\S+$/.test(id);

function argumentCompletions(command, catalog, pending) {
  const item = (value, description) => ({ value: `${command} ${value}`, label: `${command} ${value}`, description });
  const usable = (entry) => usableId(entry?.id);
  if (command === "cancel") return pending.filter(usableId).map((id) => item(id, "대기 중인 스킬 선택 취소"));
  const profiles = (catalog?.profiles ?? []).filter(usable);
  if (command === "list") return profiles.map((profile) => item(profile.id, `${profile.title} — ${profile.description}`));
  if (command === "use") {
    return [
      ...profiles.filter((profile) => PROFILE_IDS.includes(profile.id)).map((profile) => item(profile.id, `${profile.title} — ${profile.description}`)),
      item("auto", "기본 Pi 스킬 탐색 사용"),
      item("off", "프로필 안내 주입 끄기"),
    ];
  }
  if (command === "skill") {
    return (catalog?.skills ?? []).filter(usable)
      .map((skill) => item(skill.id, `${pending.includes(skill.id) ? "[대기 중] " : ""}${skill.name}: ${skill.description}`));
  }
  return [];
}

/**
 * Argument completions for `/workbench`: subcommands first, then the catalog's profiles or skill ids for `list`, `use` and `skill`,
 * and the pending selections for `cancel`.
 * A finished argument, an extra word or an argument-less subcommand gets none; a lone exact match is dropped so Enter submits.
 */
export function completeWorkbenchArguments(prefix, catalog, pending = []) {
  const match = /^(\S*)(?:\s+(\S*))?$/.exec(String(prefix ?? "").trimStart());
  if (!match) return null;
  const [, command, argument] = match;
  const typed = argument === undefined ? command : `${command} ${argument}`;
  const candidates = argument === undefined ? SUBCOMMAND_COMPLETIONS : argumentCompletions(command, catalog, pending);
  const items = candidates.filter((item) => item.value.startsWith(typed));
  if (items.length === 0 || (items.length === 1 && items[0].value === typed)) return null;
  return items.map((item) => ({ ...item }));
}

/**
 * Pi's editor asks its autocomplete provider in a forced (file) mode when Tab is pressed with no list open: that mode skips
 * extension argument completion and lists files, and for `/workbench ` (command and space) its file gate declines outright.
 * This wrapper answers both only at the argument position of `commandName` on the message's first line; every other request,
 * the completion it applies and natural (typed) completion go to the wrapped provider unchanged.
 */
export function workbenchAutocompleteProvider(current, commandName, complete) {
  const argumentAt = (lines, cursorLine, cursorCol) => {
    if (cursorLine !== 0) return undefined;
    const text = String(lines?.[0] ?? "").slice(0, cursorCol).trimStart();
    const space = text.indexOf(" ");
    // The same split as Pi's slash-command completion: the name ends at the first space, the rest is the argument text.
    if (!text.startsWith("/") || space === -1 || text.slice(1, space) !== commandName) return undefined;
    return text.slice(space + 1);
  };
  return {
    ...(current.triggerCharacters ? { triggerCharacters: current.triggerCharacters } : {}),
    async getSuggestions(lines, cursorLine, cursorCol, options) {
      const argument = options?.force ? argumentAt(lines, cursorLine, cursorCol) : undefined;
      if (argument === undefined) return current.getSuggestions(lines, cursorLine, cursorCol, options);
      const items = await complete(argument);
      return Array.isArray(items) && items.length > 0 ? { items, prefix: argument } : null;
    },
    applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
      return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
    },
    shouldTriggerFileCompletion(lines, cursorLine, cursorCol) {
      if (argumentAt(lines, cursorLine, cursorCol) !== undefined) return true;
      return typeof current.shouldTriggerFileCompletion === "function" ? current.shouldTriggerFileCompletion(lines, cursorLine, cursorCol) : true;
    },
  };
}

export function readMode(entries) {
  let mode = "auto";
  for (const entry of entries) {
    if (entry.type === "custom" && entry.customType === STATE_TYPE && MODES.has(entry.data?.mode)) {
      mode = entry.data.mode;
    }
  }
  return mode;
}

export async function readCatalog(root) {
  const catalog = JSON.parse(await readFile(join(root, "catalog.json"), "utf8"));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.profiles) || !Array.isArray(catalog.skills)) {
    throw new Error("지원하지 않는 catalog.json 형식입니다.");
  }
  return catalog;
}

function contained(root, target) {
  const part = relative(root, target);
  return part !== ".." && !part.startsWith(`..${sep}`) && !isAbsolute(part);
}

export async function resolveSkillPath(root, skillPath) {
  if (typeof skillPath !== "string" || !skillPath || isAbsolute(skillPath)) {
    throw new Error("스킬 경로는 패키지 내부의 상대 경로여야 합니다.");
  }
  const packageRoot = await realpath(root);
  const target = resolve(packageRoot, skillPath);
  if (!contained(packageRoot, target)) throw new Error("패키지 밖의 스킬 경로는 허용하지 않습니다.");
  const actual = await realpath(target);
  if (!contained(packageRoot, actual)) throw new Error("패키지 밖으로 연결된 스킬은 허용하지 않습니다.");
  if (!(await stat(actual)).isFile()) throw new Error("스킬 경로가 파일이 아닙니다.");
  return actual;
}

function findSkill(catalog, id) {
  const skill = catalog.skills.find((item) => item.id === id);
  if (!skill) throw new Error(`스킬을 찾을 수 없습니다: ${id}`);
  return skill;
}

function findProfile(catalog, id) {
  const profile = catalog.profiles.find((item) => item.id === id);
  if (!profile) throw new Error(`프로필을 찾을 수 없습니다: ${id}`);
  return profile;
}

/** One catalog skill as a one-shot selection: its original SKILL.md, read unchanged, with its canonical location and notes. */
export async function readSkill(root, skill) {
  const path = await resolveSkillPath(root, skill.path);
  const raw = await readFile(path, "utf8");
  return {
    id: skill.id,
    name: skill.name,
    path,
    baseDir: dirname(path),
    raw,
    notes: [...(skill.notes ?? [])],
    dependencies: [...(skill.dependencies ?? [])],
  };
}

/**
 * What the model receives for one-shot selections. `embedded`: the text precedes the user's request inside the same user message;
 * `after`: a message right after the request (when Pi itself expands the request, a /skill: command or a prompt template).
 * Each original SKILL.md is kept byte for byte between the markers.
 */
export function skillSelectionText(selections, root, placement = "embedded") {
  const many = selections.length > 1;
  const request = placement === "after" ? "the user request immediately before this message" : "the user request that follows this block in the same message";
  return [
    `${SKILL_MARKER} ${selections.map((selection) => `${selection.name} (${selection.id})`).join(", ")}.`,
    `The user selected ${many ? "these skills" : "this skill"} with /workbench skill for ${request}. `
      + `Apply ${many ? "them" : "it"} to that request and the work it starts only. `
      + `${many ? "They do" : "It does"} not apply to later user requests, even though this text stays in the conversation history, `
      + `and ${many ? "do" : "does"} not change the Workbench profile.`,
    "Original instructions to keep a mode active for the whole session do not apply to this one-shot selection.",
    "Respect the user's scope, requested language, and host instructions. Otherwise respond in the language of the user's request.",
    `Read the relevant Pi integration guidance in ${JSON.stringify(resolve(root, "docs/ADAPTERS.md"))}.`,
    ...selections.flatMap((selection) => [
      "",
      `## ${selection.name} (${selection.id})`,
      `Base directory: ${JSON.stringify(selection.baseDir)}`,
      "Resolve the skill's relative references from that directory.",
      ...(selection.notes.length ? ["Integration notes:", ...selection.notes.map((note) => `- ${note}`)] : []),
      ...(selection.dependencies.length ? ["Dependencies (not installed or connected by this extension):", ...selection.dependencies.map((item) => `- ${item}`)] : []),
      "--- BEGIN ORIGINAL SKILL.md ---",
      selection.raw,
      "--- END ORIGINAL SKILL.md ---",
    ]),
  ].join("\n");
}

const attribute = (value) => String(value).replace(/["\r\n]/g, " ");

/**
 * The user's request with the selections in front of it, in the format Pi itself uses for `/skill:name request`; Pi's transcript
 * shows it as a collapsed skill block followed by the request.
 */
export function embedSkillSelections(selections, root, text) {
  const name = attribute(selections.map((selection) => selection.id).join(", "));
  const block = `<skill name="${name}" location="${attribute(selections[0].path)}">\n${skillSelectionText(selections, root, "embedded")}\n</skill>`;
  return text ? `${block}\n\n${text}` : block;
}

export async function profileGuidance(root, catalog, id) {
  const profile = findProfile(catalog, id);
  const paths = await Promise.all(profile.skills.map(async (skillId) => {
    const skill = findSkill(catalog, skillId);
    return [
      `- ${skill.id}: ${JSON.stringify(await resolveSkillPath(root, skill.path))}`,
      ...(skill.notes?.length ? [`  Notes: ${skill.notes.join("; ")}`] : []),
      ...(skill.dependencies?.length ? [`  Requires: ${skill.dependencies.join("; ")}`] : []),
    ].join("\n");
  }));
  return [
    `Selected workbench profile: ${profile.title} (${id}).`,
    "This is the current profile of this conversation branch; it replaces any earlier Workbench profile guidance.",
    profile.guidance,
    `Before using an original skill, read the relevant sections of ${JSON.stringify(resolve(root, "docs/ADAPTERS.md"))} and ${JSON.stringify(resolve(root, "docs/WORKFLOWS.ko.md"))}.`,
    "Read only the relevant SKILL.md files and references for this request; do not load the entire list.",
    "The user's scope and host instructions take precedence. Dependencies are not automatically installed.",
    "Honor the user's requested language; otherwise respond in the language of the user's request.",
    ...paths,
  ].filter(Boolean).join("\n");
}

export async function probeExecutable(command, { env = process.env, platform = process.platform } = {}) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(command)) throw new Error("실행파일 이름이 올바르지 않습니다.");
  const pathValue = env.PATH ?? env.Path ?? "";
  const suffixes = platform === "win32" ? ["", ...(env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";")] : [""];
  for (const directory of pathValue.split(platform === "win32" ? ";" : delimiter).filter(Boolean)) {
    for (const suffix of suffixes) {
      const candidate = join(directory, command + suffix);
      try {
        if (!(await stat(candidate)).isFile()) continue;
        await access(candidate, constants.X_OK);
        return true;
      } catch { /* An absent or inaccessible PATH entry is not a dependency. */ }
    }
  }
  return false;
}

export async function doctor(options = {}) {
  const env = options.env ?? process.env;
  const commands = ["git", "rg", "node", "python3", "python", "uv", "ffmpeg", "ffprobe", "blender", "godot", "ast-grep"];
  const variables = ["OPENAI_API_KEY", "ELEVENLABS_API_KEY", "SCENARIO_API_KEY", "CONTEXT7_API_KEY", "LAYER_API_KEY"];
  const executables = await Promise.all(commands.map(async (name) => ({ name, present: await probeExecutable(name, options) })));
  const environment = variables.map((name) => ({ name, present: typeof env[name] === "string" && env[name].trim().length > 0 }));
  return { executables, environment };
}

// eslint-disable-next-line no-control-regex
const TERMINAL_SEQUENCES = /\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-_]|[\x00-\x08\x0b-\x1f\x7f]/g;

/**
 * Terminal columns of text for the transcript renderers, escape sequences left out: printable ASCII 1, Latin, Greek, Cyrillic,
 * general punctuation, arrows and box drawing 1 (as Pi's TUI counts them), every other character 2. It never counts fewer columns
 * than Pi's TUI, so a line wrapped to a width always fits; this package has no dependency that could load Pi's own width functions.
 */
export function displayWidth(text) {
  let width = 0;
  for (const character of String(text).replace(TERMINAL_SEQUENCES, "")) {
    const code = character.codePointAt(0);
    if (code < 0x20 || (code >= 0x7f && code < 0xa0)) continue;
    const narrow = code < 0x7f || (code >= 0xa0 && code <= 0x2ff) || (code >= 0x370 && code <= 0x4ff)
      || (code >= 0x2000 && code <= 0x206f) || (code >= 0x2190 && code <= 0x21ff) || (code >= 0x2500 && code <= 0x257f);
    width += narrow ? 1 : 2;
  }
  return width;
}

function wrapText(text, width) {
  const lines = [];
  let line = "";
  let used = 0;
  const flush = () => { lines.push(line); line = ""; used = 0; };
  for (const word of text.split(/(\s+)/)) {
    if (!word) continue;
    const size = displayWidth(word);
    if (used + size <= width) { line += word; used += size; continue; }
    if (/^\s+$/.test(word)) { flush(); continue; }
    if (used > 0) flush();
    if (size <= width) { line = word; used = size; continue; }
    for (const character of word) {
      const cell = displayWidth(character);
      if (used + cell > width && used > 0) flush();
      line += character;
      used += cell;
    }
  }
  if (line || lines.length === 0) lines.push(line);
  return lines.map((piece) => piece.trimEnd());
}

/**
 * A transcript component without a TUI dependency: rows of text with Pi's custom-message colors and padding, wrapped to the
 * width it is given. `style` "label" is the bold header, "dim" a hint.
 */
export function textBlock(rows, theme) {
  const fg = (token, text) => (typeof theme?.fg === "function" ? theme.fg(token, text) : text);
  const bg = (text) => (typeof theme?.bg === "function" ? theme.bg("customMessageBg", text) : text);
  const paint = (style, text) => {
    if (!text) return text;
    if (style === "label") return fg("customMessageLabel", `\x1b[1m${text}\x1b[22m`);
    return fg(style === "dim" ? "dim" : "customMessageText", text);
  };
  return {
    render(width) {
      if (!Number.isFinite(width) || width < 4) return [];
      const inner = width - 2;
      const row = (text, style) => bg(` ${paint(style, text)}${" ".repeat(Math.max(0, inner - displayWidth(text)))} `);
      const out = [row("")];
      for (const { text, style } of rows) {
        const clean = String(text ?? "").replace(/\t/g, "   ").replace(TERMINAL_SEQUENCES, "");
        for (const piece of wrapText(clean, inner)) out.push(row(piece, style));
      }
      out.push(row(""));
      return out;
    },
    invalidate() {},
  };
}

/** The transcript view of a command output record (OUTPUT_ENTRY_TYPE). */
export function renderOutputEntry(entry, _options, theme) {
  const data = entry?.data;
  if (!data || typeof data.text !== "string") return undefined;
  const command = typeof data.command === "string" && data.command ? data.command : "output";
  return textBlock([{ text: `[workbench ${command}]`, style: "label" }, ...data.text.split("\n").map((text) => ({ text }))], theme);
}

const messageText = (content) => (typeof content === "string" ? content
  : Array.isArray(content) ? content.filter((part) => part?.type === "text").map((part) => part.text).join("\n") : "");

/** The transcript view of a one-shot selection sent as its own message: collapsed to its ids until tool output is expanded. */
export function renderSelectedSkillMessage(message, options, theme) {
  const details = message?.details ?? {};
  const ids = Array.isArray(details.skillIds) ? details.skillIds.join(", ") : (details.skillId ?? "skill");
  /** @type {{ text: string, style?: string }[]} */
  const rows = [{ text: `[skill] ${ids} (Workbench one-shot)`, style: "label" }];
  if (options?.expanded) rows.push(...messageText(message?.content).split("\n").map((text) => ({ text })));
  else rows.push({ text: "Expand tool output to show the skill text.", style: "dim" });
  return textBlock(rows, theme);
}

function isWorkbenchContextMessage(message) {
  return message?.role === "custom" && (message.customType === PROFILE_TYPE || message.customType === OUTPUT_TYPE);
}

/**
 * Request-local projection: drop stored Workbench profile/output messages and put the
 * current profile guidance, if any, first. Other messages, including one-shot skills, are kept.
 */
export function projectProfileContext(messages, guidance) {
  const kept = messages.filter((message) => !isWorkbenchContextMessage(message));
  if (!guidance) return kept;
  return [
    { role: "custom", customType: PROFILE_TYPE, content: guidance, display: false, timestamp: kept[0]?.timestamp ?? 0 },
    ...kept,
  ];
}

const SHUTDOWN_REASONS = { reload: "/reload", new: "새 세션", resume: "세션 전환", fork: "세션 fork" };

export function registerWorkbench(pi, root) {
  const guidanceByMode = new Map();
  const reportedErrors = new Set();
  const guidanceFor = (mode) => {
    if (!guidanceByMode.has(mode)) {
      const pending = readCatalog(root).then((catalog) => profileGuidance(root, catalog, mode));
      pending.catch(() => guidanceByMode.delete(mode));
      guidanceByMode.set(mode, pending);
    }
    return guidanceByMode.get(mode);
  };
  const reportOnce = (ctx, error) => {
    const message = `Workbench: ${error instanceof Error ? error.message : String(error)}`;
    if (reportedErrors.has(message)) return;
    reportedErrors.add(message);
    ctx.ui.notify(message, "error");
  };
  // Completion reads only catalog.json (cached; retried after a failure), never a SKILL.md, and changes no state.
  let completionCatalog;
  const catalogForCompletion = () => {
    completionCatalog ??= readCatalog(root).catch(() => { completionCatalog = undefined; return undefined; });
    return completionCatalog;
  };

  /**
   * One-shot selections waiting for the next user request, one per skill id, in selection order. They live in this extension
   * runtime only: /reload, a session switch and a branch change (session_tree) drop them, with a notice.
   */
  let pending = [];
  /** Selections still reading their SKILL.md, by id: a cancel or a drop before the read ends removes the entry, and the read is discarded. */
  const loading = new Map();
  /** The reads in progress: a user request that arrives meanwhile waits for them, so a selection made before it goes with it. */
  const reads = new Set();
  /** Selections taken by an idle request that Pi expands itself; sent with that request's start (before_agent_start). */
  let deferred;
  let disposed = false;
  const pendingIds = () => pending.map((selection) => selection.id);
  const waiting = () => [...pendingIds(), ...loading.keys()];
  const notify = (ctx, message, level = "info") => { try { ctx.ui.notify(message, level); } catch { /* the UI may be gone */ } };
  /** Selections an idle request took that never started (Pi stopped it before the run, e.g. no model): dropped, never moved on. */
  const dropDeferred = (ctx) => {
    if (!deferred) return;
    const ids = deferred.map((selection) => selection.id).join(", ");
    deferred = undefined;
    notify(ctx, `Workbench: 스킬(${ids})을 받을 요청이 시작되지 않아 선택을 취소했습니다. 필요하면 /workbench skill <id>로 다시 선택하세요.`, "warning");
  };
  const dropAll = () => {
    const ids = [...new Set([...(deferred ?? []).map((selection) => selection.id), ...waiting()])];
    deferred = undefined;
    pending = [];
    loading.clear();
    return ids;
  };

  const canRenderEntries = typeof pi.registerEntryRenderer === "function";
  if (canRenderEntries) pi.registerEntryRenderer(OUTPUT_ENTRY_TYPE, renderOutputEntry);
  if (typeof pi.registerMessageRenderer === "function") pi.registerMessageRenderer(SELECTED_SKILL_TYPE, renderSelectedSkillMessage);
  /**
   * Longer command output: a session entry (excluded from the model context by Pi) that the interactive transcript renders, so a
   * later notice cannot replace it and it is still there when the session is opened again. Other modes, and hosts without session
   * entries or entry renderers, also get the notification.
   */
  const show = (ctx, command, text) => {
    let recorded = false;
    try {
      pi.appendEntry(OUTPUT_ENTRY_TYPE, { command, text });
      recorded = true;
    } catch { /* a host without session entries */ }
    if (!recorded || !canRenderEntries || ctx.mode !== "tui") ctx.ui.notify(text, "info");
  };
  const statusText = (ctx) => {
    const ids = waiting();
    return [
      `Workbench profile: ${readMode(ctx.sessionManager.getBranch())}`,
      ids.length
        ? `대기 중인 스킬 선택 (다음 사용자 요청 한 번): ${ids.join(", ")} — 취소: /workbench cancel [id]`
        : "대기 중인 스킬 선택: 없음",
    ].join("\n");
  };
  const completeArguments = async (prefix) => {
    // Only the argument of list/use/skill needs the catalog: other contexts do no I/O.
    const [, command] = /^(\S+)\s/.exec(String(prefix ?? "").trimStart()) ?? [];
    const needsCatalog = CATALOG_ARGUMENT_COMMANDS.includes(command);
    return completeWorkbenchArguments(prefix, needsCatalog ? await catalogForCompletion() : undefined, waiting());
  };

  pi.registerCommand("workbench", {
    description: "Browse skills, select a workflow, or check local dependencies",
    getArgumentCompletions: completeArguments,
    handler: async (args, ctx) => {
      const [command = "help", argument, ...extra] = args.trim().split(/\s+/).filter(Boolean);
      try {
        if (extra.length || (!ARGUMENT_COMMANDS.includes(command) && argument)) throw new Error(HELP);
        if (command === "help") return show(ctx, "help", HELP);
        if (command === "status") return show(ctx, "status", statusText(ctx));
        if (command === "use") {
          if (!MODES.has(argument)) throw new Error(`사용할 프로필을 지정하세요.\n${HELP}`);
          if (PROFILE_IDS.includes(argument)) findProfile(await readCatalog(root), argument);
          pi.appendEntry(STATE_TYPE, { mode: argument });
          return ctx.ui.notify(`Workbench profile: ${argument}`, "info");
        }
        if (command === "doctor") {
          const result = await doctor();
          return show(ctx, "doctor", [
            "Local executables (PATH):",
            ...result.executables.map((item) => `- ${item.name}: ${item.present ? "found" : "not found"}`),
            "Environment variables (values are never displayed):",
            ...result.environment.map((item) => `- ${item.name}: ${item.present ? "set" : "not set"}`),
            "선택 기능별 의존성입니다. 설치·버전·API 인증·MCP 연결·호스트 생성 도구는 검증하지 않았습니다.",
          ].join("\n"));
        }
        if (command === "cancel") {
          if (!argument) {
            const ids = dropAll();
            return ctx.ui.notify(ids.length ? `Workbench: 대기 중이던 스킬 선택을 취소했습니다: ${ids.join(", ")}` : "Workbench: 대기 중인 스킬 선택이 없습니다.", "info");
          }
          if (!waiting().includes(argument)) throw new Error(`대기 중인 스킬 선택이 아닙니다: ${argument}`);
          pending = pending.filter((selection) => selection.id !== argument);
          loading.delete(argument);
          const left = waiting();
          return ctx.ui.notify(`Workbench: ${argument} 선택을 취소했습니다.${left.length ? ` 남은 선택: ${left.join(", ")}` : ""}`, "info");
        }
        if (command !== "list" && command !== "skill") throw new Error(HELP);
        if (command === "skill" && !argument) throw new Error("사용법: /workbench skill <id>");
        if (command === "skill" && waiting().includes(argument)) {
          return ctx.ui.notify(`Workbench: ${argument}은(는) 이미 다음 사용자 요청에 붙을 예정입니다. 같은 스킬은 한 번만 붙습니다.`, "info");
        }
        // A cancel or a drop (branch change, reload) while the SKILL.md is read removes this token: the read then no longer counts.
        // A user request that arrives during the read waits for it (input event), so the selection still goes with that request.
        const token = {};
        let kept = true;
        /** @type {(value?: unknown) => void} */
        let release = () => {};
        const read = command === "skill" ? new Promise((resolve) => { release = resolve; }) : undefined;
        if (read) {
          loading.set(argument, token);
          reads.add(read);
        }
        try {
          let catalog;
          let selection;
          try {
            catalog = await readCatalog(root);
            if (command === "skill") selection = await readSkill(root, findSkill(catalog, argument));
          } finally {
            if (command === "skill") {
              kept = loading.get(argument) === token;
              if (kept) loading.delete(argument);
            }
          }
          if (disposed) return undefined;
          if (command === "list") {
            const profile = argument ? findProfile(catalog, argument) : undefined;
            const skills = profile ? profile.skills.map((id) => findSkill(catalog, id)) : catalog.skills;
            return show(ctx, profile ? `list ${profile.id}` : "list", [
              profile ? `${profile.title} — ${profile.description}` : `Profiles: ${catalog.profiles.map((item) => item.id).join(", ")}`,
              ...skills.map((skill) => `- ${skill.id} — ${skill.name}: ${skill.description}`),
            ].join("\n"));
          }
          if (!kept) {
            return ctx.ui.notify(`Workbench: ${selection.id}을(를) 불러오는 동안 선택이 취소되어 붙이지 않습니다. 필요하면 다시 선택하세요.`, "warning");
          }
          if (pending.some((item) => item.id === selection.id)) {
            return ctx.ui.notify(`Workbench: ${selection.id}은(는) 이미 다음 사용자 요청에 붙을 예정입니다. 같은 스킬은 한 번만 붙습니다.`, "info");
          }
          pending.push(selection);
          ctx.ui.notify(`Workbench: ${selection.id} 원본 스킬을 다음 사용자 요청 한 번에 붙입니다 (대기: ${pendingIds().join(", ")}; 취소: /workbench cancel).`, "info");
        } finally {
          if (read) {
            reads.delete(read);
            release();
          }
        }
      } catch (error) {
        ctx.ui.notify(`Workbench: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    },
  });

  /** Whether Pi expands this text itself after the input event (a /skill: command or a prompt template); on an unknown host, any slash text. */
  const expandsItself = (text) => {
    const match = /^\/(\S+)/.exec(text);
    if (!match) return false;
    let commands;
    try {
      commands = pi.getCommands();
    } catch {
      return true;
    }
    if (!Array.isArray(commands)) return true;
    return commands.some((command) => command?.name === match[1] && (command.source === "skill" || command.source === "prompt"));
  };

  /**
   * The next user request takes the pending selections: a prompt, a steering or follow-up message typed while the agent works,
   * an RPC prompt, or a user message an extension submits on the user's behalf (for example /orche single, a follow-up orche held
   * back, a prompt the session-bus work queue replays). Messages extensions send themselves (task results, peer notes: sendMessage,
   * also with triggerTurn) never pass through this event. Pi runs it before expanding /skill: commands and prompt templates.
   * Selections that cannot go with that request are cancelled with a notice, never kept for a later one.
   */
  const takeSelections = (event, ctx) => {
    dropDeferred(ctx);
    if (!pending.length) return undefined;
    const text = typeof event?.text === "string" ? event.text : "";
    const ids = pendingIds().join(", ");
    if (expandsItself(text)) {
      // Text in front would stop Pi's expansion; text after it would become a template's arguments or the skill command's request.
      // Idle: the selections follow the request as a message at its start (before_agent_start).
      if (!event?.streamingBehavior) {
        deferred = pending;
        pending = [];
        return undefined;
      }
      // Queued while the agent works: Pi expands and queues it right after this event, and no hook runs again before the model
      // receives it. The selections cannot go with it and must not move on to a later request.
      dropAll();
      notify(ctx, `Workbench: 작업 중 대기열에 넣는 /skill:·프롬프트 템플릿 요청에는 Workbench 스킬을 붙일 수 없어 선택(${ids})을 취소했습니다. 이후 요청으로 넘기지 않습니다. 이 요청에 필요하면 작업이 끝난 뒤 /workbench skill <id>로 다시 선택하고 보내거나, 다시 선택한 뒤 일반 문장으로 steering/follow-up을 보내세요.`, "warning");
      return undefined;
    }
    const selections = pending;
    pending = [];
    const how = event?.streamingBehavior === "steer" ? " (steering)" : event?.streamingBehavior === "followUp" ? " (follow-up)" : "";
    const from = event?.source === "extension" ? " (확장이 사용자 대신 보낸 요청)" : "";
    notify(ctx, `Workbench: ${ids} 스킬을 이 사용자 요청${how}${from}에 붙였습니다.`, "info");
    return { action: "transform", text: embedSkillSelections(selections, root, text) };
  };
  // A selection still being read was made before this request: wait for the read, so it goes with this request.
  pi.on("input", (event, ctx) => (reads.size ? Promise.all([...reads]).then(() => takeSelections(event, ctx)) : takeSelections(event, ctx)));

  // Pi: profile guidance is projected into each model request and never stored.
  pi.on("context", async (event, ctx) => {
    const messages = event.messages ?? [];
    const mode = readMode(ctx.sessionManager.getBranch());
    let guidance;
    if (mode !== "auto" && mode !== "off") {
      try {
        guidance = await guidanceFor(mode);
      } catch (error) {
        reportOnce(ctx, error);
      }
    }
    const projected = projectProfileContext(messages, guidance);
    if (!guidance && projected.length === messages.length) return undefined;
    return { messages: projected };
  });

  // The start of an idle request: selections it took after Pi's own expansion follow it as one message. Hosts without structured
  // Pi prompt options (for example OMP) otherwise keep the additive profile message, which that one request then goes without.
  pi.on("before_agent_start", async (event, ctx) => {
    if (deferred) {
      const selections = deferred;
      deferred = undefined;
      const skillIds = selections.map((selection) => selection.id);
      notify(ctx, `Workbench: ${skillIds.join(", ")} 스킬을 이 사용자 요청 바로 뒤에 붙였습니다.`, "info");
      return { message: { customType: SELECTED_SKILL_TYPE, content: skillSelectionText(selections, root, "after"), display: true, details: { skillIds, placement: "after" } } };
    }
    if (event?.systemPromptOptions) return undefined;
    const mode = readMode(ctx.sessionManager.getBranch());
    if (mode === "auto" || mode === "off") return undefined;
    try {
      return { message: { customType: PROFILE_TYPE, content: await guidanceFor(mode), display: false } };
    } catch (error) {
      reportOnce(ctx, error);
      return undefined;
    }
  });

  // Tab completion at /workbench argument positions with no list open (Pi's forced mode); see workbenchAutocompleteProvider.
  const ownRoot = resolve(root);
  const invocationName = () => {
    try {
      const own = pi.getCommands().find((command) => command?.source === "extension" && /^workbench(?::\d+)?$/.test(command.name)
        && typeof command.sourceInfo?.path === "string" && contained(ownRoot, resolve(command.sourceInfo.path)));
      return own?.name ?? "workbench";
    } catch {
      return "workbench";
    }
  };
  pi.on("session_start", (_event, ctx) => {
    let ui;
    try {
      ui = ctx.ui;
    } catch {
      return;
    }
    if (typeof ui?.addAutocompleteProvider !== "function") return;
    const name = invocationName();
    ui.addAutocompleteProvider((current) => workbenchAutocompleteProvider(current, name, completeArguments));
  });

  // A selection belongs to the branch and runtime it was made in: it never moves to another branch, a reload or another session.
  pi.on("session_tree", (_event, ctx) => {
    const ids = dropAll();
    if (ids.length) notify(ctx, `Workbench: 분기를 옮겨 대기 중이던 스킬 선택을 취소했습니다: ${ids.join(", ")}. 필요하면 이 분기에서 다시 선택하세요.`, "warning");
  });
  pi.on("session_shutdown", (event, ctx) => {
    const ids = dropAll();
    disposed = true;
    const reason = SHUTDOWN_REASONS[event?.reason];
    if (ids.length && reason) notify(ctx, `Workbench: 대기 중이던 스킬 선택을 취소했습니다 (${reason}): ${ids.join(", ")}. 필요하면 다시 선택하세요.`, "warning");
  });
}
