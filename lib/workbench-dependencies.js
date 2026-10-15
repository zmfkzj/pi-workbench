// pi-workbench's items for the dependency contract (lib/dependencies.js): the local tools and environment variables that
// optional skills need, with the concrete install or configuration step per platform, and the few tools install-deps can
// install without privileges. Workbench itself uses only Pi and Node.js built-ins; nothing here is needed to load it.
import { accessSync, constants, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { findExecutable, outputTail, runProcess } from "./dependencies.js";

/** @typedef {import("./dependencies.js").DependencyItem} DependencyItem */
/** @typedef {import("./dependencies.js").RunResult} RunResult */
/** @typedef {{ linux?: string, darwin?: string, win32?: string, other?: string, all?: string }} PlatformSteps */
/**
 * @typedef {object} ToolInfo
 * @property {string} purpose The skills (and profiles) that use it.
 * @property {PlatformSteps} steps The manual install step per platform.
 * @property {"npm" | "pipx"} [auto] The unprivileged method install-deps uses.
 */

export const DEPENDENCY_PROVIDER_ID = "pi-workbench";
export const DEPENDENCY_LABEL = "pi-workbench";
export const DEPENDENCY_COMMAND = "/workbench";

const FFMPEG = { linux: "sudo apt install ffmpeg (Debian/Ubuntu) or sudo dnf install ffmpeg (Fedora, RPM Fusion)", darwin: "brew install ffmpeg", win32: "winget install --id Gyan.FFmpeg -e", other: "Install FFmpeg from https://ffmpeg.org/download.html and put ffmpeg and ffprobe on PATH" };

/** @type {Record<string, ToolInfo>} */
export const TOOLS = {
  git: {
    purpose: "coding workflows (repository history and diffs)",
    steps: { linux: "sudo apt install git (Debian/Ubuntu) or sudo dnf install git (Fedora)", darwin: "xcode-select --install (or brew install git)", win32: "winget install --id Git.Git -e", other: "Install Git from https://git-scm.com/downloads" },
  },
  rg: {
    purpose: "fast code and text search (search-first, game-feel; coding, game, requirements)",
    steps: { linux: "sudo apt install ripgrep (Debian/Ubuntu) or sudo dnf install ripgrep (Fedora); without privileges: cargo install ripgrep", darwin: "brew install ripgrep", win32: "winget install --id BurntSushi.ripgrep.MSVC -e", other: "cargo install ripgrep (https://github.com/BurntSushi/ripgrep#installation)" },
  },
  node: {
    purpose: "video-director (Node 22+) and the ctx7 CLI of find-docs (promo, coding, vision)",
    steps: { linux: "nvm install 22 (https://github.com/nvm-sh/nvm, no privileges), or Node.js 22+ from https://nodejs.org", darwin: "brew install node", win32: "winget install --id OpenJS.NodeJS.LTS -e", other: "Install Node.js 22+ from https://nodejs.org" },
  },
  python: {
    purpose: "Python skill scripts: tao-validate-recipe-transfer, create-game-assets, ui-ux-pro-max, video-director, imagegen (analysis, vision, game, promo, coding)",
    steps: { linux: "sudo apt install python3 python3-pip python3-venv (Debian/Ubuntu) or sudo dnf install python3 (Fedora)", darwin: "brew install python", win32: "winget install --id Python.Python.3.12 -e", other: "Install Python 3.10+ from https://www.python.org/downloads/" },
  },
  uv: {
    purpose: "imagegen's preferred Python environment tool (uv pip install openai pillow; game, promo)",
    auto: "pipx",
    steps: { linux: "pipx install uv, or the official installer: curl -LsSf https://astral.sh/uv/install.sh | sh", darwin: "brew install uv (or pipx install uv)", win32: "winget install --id astral-sh.uv -e (or pipx install uv)", other: "pipx install uv (https://docs.astral.sh/uv/getting-started/installation/)" },
  },
  ffmpeg: { purpose: "video-director rendering (FFmpeg; promo)", steps: FFMPEG },
  ffprobe: { purpose: "video-director media probing (ships with FFmpeg; promo)", steps: FFMPEG },
  blender: {
    purpose: "create-game-assets 3D pipeline, only when 3D assets are built locally (game, promo)",
    steps: { linux: "sudo snap install blender --classic, or download https://www.blender.org/download/ and put blender on PATH", darwin: "brew install --cask blender", win32: "winget install --id BlenderFoundation.Blender -e", other: "Download Blender from https://www.blender.org/download/ and put blender on PATH" },
  },
  godot: {
    purpose: "game-feel, game-ui-ux and create-game-assets in Godot projects (game)",
    steps: { linux: "Download Godot from https://godotengine.org/download/linux/ and put the executable on PATH as godot", darwin: "brew install --cask godot", win32: "winget install --id GodotEngine.GodotEngine -e", other: "Download Godot from https://godotengine.org/download/ and put the executable on PATH as godot" },
  },
  "ast-grep": {
    purpose: "ast-grep and ast-grep-outline skills (coding)",
    auto: "npm",
    steps: { all: "npm install -g @ast-grep/cli (or brew install ast-grep, cargo install ast-grep --locked, pipx install ast-grep-cli)" },
  },
};

/** @type {Record<string, { purpose: string, where: string }>} */
export const VARIABLES = {
  OPENAI_API_KEY: { purpose: "imagegen through the OpenAI API (not needed when the host has its own image tool)", where: "https://platform.openai.com/api-keys" },
  ELEVENLABS_API_KEY: { purpose: "sound-effects and music (ElevenLabs CLI/SDK)", where: "https://elevenlabs.io/app/settings/api-keys" },
  SCENARIO_API_KEY: { purpose: "create-game-assets with a connected Scenario generation tool", where: "your Scenario account (https://app.scenario.com)" },
  CONTEXT7_API_KEY: { purpose: "find-docs through the ctx7 CLI or Context7 MCP (optional; raises rate limits)", where: "https://context7.com/dashboard" },
  LAYER_API_KEY: { purpose: "create-game-assets with a connected Layer generation tool", where: "your Layer account settings" },
};

const PYTHON_MODULES = "NumPy and Pillow (tao-validate-recipe-transfer, create-game-assets), fonttools and brotli (video-director), "
  + "openai (imagegen API path), fiftyone (fiftyone-model-evaluation)";
const PYTHON_STEP = "verify with python3 -c \"import numpy, PIL, fontTools, brotli\" and install what a skill needs into the "
  + "project's environment: python3 -m pip install numpy pillow fonttools brotli (on an externally managed Python use a venv, "
  + "uv pip install ..., or python3 -m pip install --user ... where allowed)";

export const CHECK_NOTE = "Workbench itself needs only Pi and Node.js built-ins (no npm install). The tools and variables below serve "
  + "optional skills per profile; only their presence is checked (versions, API authentication, MCP connections and host "
  + `generation tools are not verified). Python modules are not checked (that would run Python): ${PYTHON_MODULES}; ${PYTHON_STEP}.`;
export const INSTALL_NOTE = "Workbench itself needs no npm install. install-deps installs only ast-grep (npm -g into a user-writable "
  + "npm prefix) and uv (pipx) by itself; other tools and API keys are listed as manual steps (no sudo, no changes to your "
  + `environment or credentials). Python modules are not installed (no single correct Python environment): ${PYTHON_STEP}.`;

/**
 * @param {PlatformSteps} steps
 * @param {string} platform
 */
function stepFor(steps, platform) {
  if (steps.all) return steps.all;
  return (platform === "linux" || platform === "darwin" || platform === "win32" ? steps[platform] : undefined) ?? steps.other ?? steps.linux ?? "";
}

/**
 * The manual install step for `name` on `platform`, then restarting Pi so the new PATH applies.
 * @param {string} name
 * @param {string} [platform]
 */
export function toolAction(name, platform = process.platform) {
  const info = TOOLS[name];
  const step = info ? stepFor(info.steps, platform) : `Install ${name} and put it on PATH`;
  return `${step}; then restart Pi so its PATH includes it`;
}

/**
 * How to set an environment variable without showing its value.
 * @param {string} name
 * @param {string} [platform]
 */
export function variableAction(name, platform = process.platform) {
  const where = VARIABLES[name]?.where;
  const set = platform === "win32" ? `setx ${name} "<your key>"` : `add export ${name}=<your key> to your shell profile`;
  return `Set ${name} in the environment that starts Pi (${set}${where ? `; key from ${where}` : ""}), then restart Pi`;
}

const purposeOf = (name) => TOOLS[name]?.purpose ?? "optional skills";

/**
 * Presence (from runtime.js `doctor`) as contract items: a missing tool or variable is an optional `warn` with its step.
 * python3 and python are one item: either one serves the scripts. Python modules are not checked (see CHECK_NOTE).
 * @param {{ executables: { name: string, present: boolean }[], environment: { name: string, present: boolean }[] }} presence
 * @param {{ platform?: string }} [options]
 * @returns {DependencyItem[]}
 */
export function checkItems(presence, { platform = process.platform } = {}) {
  /** @type {DependencyItem[]} */
  const items = [];
  const found = new Map(presence.executables.map(({ name, present }) => [name, present]));
  for (const { name, present } of presence.executables) {
    if (name === "python") continue;
    if (name === "python3") {
      const python3 = present;
      const python = found.get("python") === true;
      const detail = `python3: ${python3 ? "found" : "not found"}, python: ${python ? "found" : "not found"} on PATH`;
      items.push(python3 || python
        ? { name: "python3 / python", status: "ok", detail }
        : { name: "python3 / python", status: "warn", optional: true, detail: `${detail}; needed for ${purposeOf("python")}`, action: toolAction("python", platform) });
      continue;
    }
    items.push(present
      ? { name, status: "ok", detail: "found on PATH" }
      : { name, status: "warn", optional: true, detail: `not found on PATH; needed for ${purposeOf(name)}`, action: toolAction(name, platform) });
  }
  if (!found.has("python3") && found.has("python")) {
    items.push(found.get("python") ? { name: "python", status: "ok", detail: "found on PATH" } : { name: "python", status: "warn", optional: true, detail: `not found on PATH; needed for ${purposeOf("python")}`, action: toolAction("python", platform) });
  }
  for (const { name, present } of presence.environment) {
    items.push(present
      ? { name, status: "ok", detail: "set" }
      : { name, status: "warn", optional: true, detail: `not set; needed for ${VARIABLES[name]?.purpose ?? "optional skills"}`, action: variableAction(name, platform) });
  }
  return items;
}

/**
 * Whether `directory` (or, when it does not exist yet, its nearest existing parent) is writable by this user.
 * @param {string} directory
 */
export function isWritableDirectory(directory) {
  for (let dir = resolve(directory); ; dir = dirname(dir)) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        return true;
      } catch {
        return false;
      }
    }
    if (dirname(dir) === dir) return false;
  }
}

/**
 * @typedef {object} InstallOptions
 * @property {Record<string, string | undefined>} [env]
 * @property {string} [platform]
 * @property {typeof runProcess} [run]
 * @property {string} [homeDir]
 * @property {AbortSignal} [signal]
 * @property {(directory: string) => boolean} [isWritable]
 */

/**
 * After an install: "installed" when the tool is on PATH, "manual" when it landed in `binDir` outside PATH, else "failed".
 * @param {string} name
 * @param {string} binDir
 * @param {Record<string, string | undefined>} env
 * @param {string} how
 * @param {string} platform
 * @returns {DependencyItem}
 */
function recheck(name, binDir, env, how, platform) {
  const onPath = findExecutable(name, env);
  if (onPath) return { name, status: "installed", optional: true, detail: `installed with ${how}: ${onPath}`, action: "Restart Pi (or /reload) so skills see it" };
  const elsewhere = findExecutable(name, env, [binDir]);
  if (elsewhere) {
    const add = platform === "win32" ? `add ${binDir} to your user PATH` : `add export PATH="${binDir}:$PATH" to your shell profile`;
    return { name, status: "manual", optional: true, detail: `installed with ${how} to ${elsewhere}, but ${binDir} is not on PATH`, action: `${add}, then restart Pi` };
  }
  return { name, status: "failed", optional: true, detail: `${how} reported success but ${name} is not found on PATH or in ${binDir}`, action: `Run by hand and read its output: ${toolAction(name, platform)}` };
}

/**
 * ast-grep through npm's global prefix, only when npm is on PATH and that prefix is writable without privileges.
 * @param {Required<Pick<InstallOptions, "env" | "platform" | "run" | "isWritable">> & InstallOptions} options
 * @returns {Promise<DependencyItem>}
 */
async function installWithNpm({ env, platform, run, isWritable, signal }) {
  const name = "ast-grep";
  const windows = platform === "win32";
  const npm = windows ? "npm.cmd" : "npm";
  if (!findExecutable("npm", env)) {
    return { name, status: "manual", optional: true, detail: `not found on PATH; npm is not on PATH either (needed for ${purposeOf(name)})`, action: toolAction(name, platform) };
  }
  const prefixResult = await run(npm, ["prefix", "-g"], { env, signal, timeoutMs: 15_000, shell: windows });
  const prefix = prefixResult.code === 0 ? prefixResult.stdout.trim().split(/\r?\n/).pop()?.trim() : undefined;
  if (!prefix) {
    return { name, status: "manual", optional: true, detail: `could not read npm's global prefix: ${outputTail(prefixResult) || "no output"}`, action: toolAction(name, platform) };
  }
  const modules = windows ? join(prefix, "node_modules") : join(prefix, "lib", "node_modules");
  const binDir = windows ? prefix : join(prefix, "bin");
  if (!isWritable(modules) || !isWritable(binDir)) {
    const userPrefix = windows ? "%APPDATA%\\npm" : "~/.npm-global";
    return {
      name, status: "manual", optional: true,
      detail: `not found on PATH; npm's global prefix ${prefix} is not writable without privileges (install-deps never uses sudo)`,
      action: `Use a user prefix: npm config set prefix ${userPrefix}, put ${windows ? userPrefix : `${userPrefix}/bin`} on PATH, then npm install -g @ast-grep/cli (or brew install ast-grep, cargo install ast-grep --locked, pipx install ast-grep-cli)`,
    };
  }
  const result = await run(npm, ["install", "-g", "@ast-grep/cli", "--no-audit", "--no-fund"], { env, signal, timeoutMs: 10 * 60_000, shell: windows });
  if (result.code !== 0) {
    return { name, status: "failed", optional: true, detail: `npm install -g @ast-grep/cli exited ${result.code ?? "abnormally"}: ${outputTail(result)}`, action: `Run by hand and read the error: npm install -g @ast-grep/cli (alternatives: brew install ast-grep, cargo install ast-grep --locked, pipx install ast-grep-cli)` };
  }
  return recheck(name, binDir, env, "npm install -g @ast-grep/cli", platform);
}

/**
 * uv through pipx (user install into PIPX_BIN_DIR, default ~/.local/bin), only when pipx is on PATH.
 * @param {Required<Pick<InstallOptions, "env" | "platform" | "run" | "homeDir">> & InstallOptions} options
 * @returns {Promise<DependencyItem>}
 */
async function installWithPipx({ env, platform, run, homeDir, signal }) {
  const name = "uv";
  const pipx = findExecutable("pipx", env);
  if (!pipx) {
    return { name, status: "manual", optional: true, detail: `not found on PATH; pipx is not on PATH, so install-deps does not install it (needed for ${purposeOf(name)})`, action: toolAction(name, platform) };
  }
  const result = await run(pipx, ["install", "uv"], { env, signal, timeoutMs: 10 * 60_000 });
  if (result.code !== 0) {
    return { name, status: "failed", optional: true, detail: `pipx install uv exited ${result.code ?? "abnormally"}: ${outputTail(result)}`, action: `Run by hand and read the error: pipx install uv (or ${stepFor(TOOLS.uv.steps, platform)})` };
  }
  const binDir = env.PIPX_BIN_DIR || join(homeDir, ".local", "bin");
  const item = recheck(name, binDir, env, "pipx install uv", platform);
  if (item.status === "manual") item.action = `Run pipx ensurepath (or ${item.action})`;
  return item;
}

/**
 * install-deps for the tools and variables: present ones are "ok", ast-grep (npm) and uv (pipx) are installed when that
 * works without privileges, every other missing tool and variable is "manual" with the exact step.
 * @param {{ executables: { name: string, present: boolean }[], environment: { name: string, present: boolean }[] }} presence
 * @param {InstallOptions} [options]
 * @returns {Promise<DependencyItem[]>}
 */
export async function installItems(presence, options = {}) {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const resolved = { ...options, env, platform, run: options.run ?? runProcess, homeDir: options.homeDir ?? homedir(), isWritable: options.isWritable ?? isWritableDirectory };
  /** @type {DependencyItem[]} */
  const items = [];
  for (const item of checkItems(presence, { platform })) {
    if (item.status === "ok") {
      items.push({ ...item, detail: `already available (${item.detail})` });
    } else if (TOOLS[item.name]?.auto === "npm") {
      items.push(await installWithNpm(resolved));
    } else if (TOOLS[item.name]?.auto === "pipx") {
      items.push(await installWithPipx(resolved));
    } else if (item.name in VARIABLES) {
      items.push({ ...item, status: "manual", detail: "not set (credentials are never written by install-deps)" });
    } else {
      items.push({ ...item, status: "manual", detail: `${item.detail}; needs a system package manager or a manual download` });
    }
  }
  return items;
}
