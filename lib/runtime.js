import { constants } from "node:fs";
import { access, readFile, realpath, stat } from "node:fs/promises";
import { delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const STATE_TYPE = "pi-workbench.state";
export const PROFILE_IDS = Object.freeze([
  "requirements", "game", "analysis", "vision", "manufacturing", "coding", "promo",
]);
const MODES = new Set(["auto", "off", ...PROFILE_IDS]);
const HELP = [
  "/workbench list [profile] — 스킬 목록",
  "/workbench use <profile|auto|off> — 현재 세션 분기의 프로필 선택",
  "/workbench skill <id> — 원본 스킬을 다음 요청에 한 번 전달",
  "/workbench status — 현재 프로필",
  "/workbench doctor — 실행파일·환경변수 존재 확인",
  `Profiles: ${PROFILE_IDS.join(", ")}`,
  "auto: 기본 스킬 탐색 사용. off: 프로필 안내 주입 끄기. 둘 다 설치된 스킬은 유지합니다.",
].join("\n");

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

export async function readSkill(root, skill) {
  const path = await resolveSkillPath(root, skill.path);
  const raw = await readFile(path, "utf8");
  const baseDir = dirname(path);
  const notes = (skill.notes ?? []).map((note) => `- ${note}`);
  const dependencies = (skill.dependencies ?? []).map((item) => `- ${item}`);
  return {
    raw,
    path,
    baseDir,
    content: [
      `Selected skill: ${skill.name} (${skill.id})`,
      "Apply this explicit selection only to the next user request and its continuations; it does not change the Workbench profile.",
      "Original instructions to keep a mode active for the whole session do not apply to this one-shot selection.",
      "Respect the user's scope, requested language, and host instructions. Otherwise respond in the language of the user's request.",
      `Read the relevant Pi integration guidance in ${JSON.stringify(resolve(root, "docs/ADAPTERS.md"))}.`,
      `Base directory: ${JSON.stringify(baseDir)}`,
      "Resolve the skill's relative references from that directory.",
      ...(notes.length ? ["Integration notes:", ...notes] : []),
      ...(dependencies.length ? ["Dependencies (not installed or connected by this extension):", ...dependencies] : []),
      "--- BEGIN ORIGINAL SKILL.md ---",
      raw,
      "--- END ORIGINAL SKILL.md ---",
    ].join("\n"),
  };
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

function display(pi, content) {
  pi.sendMessage({ customType: "pi-workbench.output", content, display: true }, { triggerTurn: false });
}

export function registerWorkbench(pi, root) {
  pi.registerCommand("workbench", {
    description: "Browse skills, select a workflow, or check local dependencies",
    handler: async (args, ctx) => {
      const [command = "help", argument, ...extra] = args.trim().split(/\s+/).filter(Boolean);
      try {
        if (extra.length || (!['list', 'use', 'skill'].includes(command) && argument)) throw new Error(HELP);
        if (command === "help") return display(pi, HELP);
        if (command === "status") return display(pi, `Workbench profile: ${readMode(ctx.sessionManager.getBranch())}`);
        if (command === "use") {
          if (!MODES.has(argument)) throw new Error(`사용할 프로필을 지정하세요.\n${HELP}`);
          if (PROFILE_IDS.includes(argument)) findProfile(await readCatalog(root), argument);
          pi.appendEntry(STATE_TYPE, { mode: argument });
          return display(pi, `Workbench profile: ${argument}`);
        }
        if (command === "doctor") {
          const result = await doctor();
          return display(pi, [
            "Local executables (PATH):",
            ...result.executables.map((item) => `- ${item.name}: ${item.present ? "found" : "not found"}`),
            "Environment variables (values are never displayed):",
            ...result.environment.map((item) => `- ${item.name}: ${item.present ? "set" : "not set"}`),
            "선택 기능별 의존성입니다. 설치·버전·API 인증·MCP 연결·호스트 생성 도구는 검증하지 않았습니다.",
          ].join("\n"));
        }
        if (command !== "list" && command !== "skill") throw new Error(HELP);
        const catalog = await readCatalog(root);
        if (command === "list") {
          const profile = argument ? findProfile(catalog, argument) : undefined;
          const skills = profile ? profile.skills.map((id) => findSkill(catalog, id)) : catalog.skills;
          return display(pi, [
            profile ? `${profile.title} — ${profile.description}` : `Profiles: ${catalog.profiles.map((item) => item.id).join(", ")}`,
            ...skills.map((skill) => `- ${skill.id} — ${skill.name}: ${skill.description}`),
          ].join("\n"));
        }
        if (!argument) throw new Error("사용법: /workbench skill <id>");
        const skill = findSkill(catalog, argument);
        const loaded = await readSkill(root, skill);
        pi.sendMessage({
          customType: "pi-workbench.selected-skill",
          content: loaded.content,
          display: true,
          details: { skillId: skill.id, baseDir: loaded.baseDir },
        }, { triggerTurn: false, deliverAs: "nextTurn" });
        ctx.ui.notify(`${skill.id}: 다음 요청에 원본 스킬을 전달합니다.`, "info");
      } catch (error) {
        ctx.ui.notify(`Workbench: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    },
  });

  pi.on("before_agent_start", async (_event, ctx) => {
    const mode = readMode(ctx.sessionManager.getBranch());
    if (mode === "auto" || mode === "off") return;
    try {
      return { message: {
        customType: "pi-workbench.profile",
        content: await profileGuidance(root, await readCatalog(root), mode),
        display: false,
      } };
    } catch (error) {
      ctx.ui.notify(`Workbench: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  });
}
