// Access boundary for every model run of the follow-up pilot (bubblewrap).
//
// Compared with ../../policy-pilot/harness/sandbox.mjs, the whole real HOME is hidden (not only ~/Code and ~/.pi/agent):
// an empty tmpfs covers it and only the runtime pieces Pi needs are bound back read-only (the Pi bundle and its
// node runtime, the provider extension and its config). /tmp is a private tmpfs; the run directory is the only
// writable path; an optional tool directory (ast-grep binaries only) is bound read-only. Graders, reference
// solutions, other runs, the repositories, Pi sessions and other credentials are not visible inside.
// Limit: the provider config (local CLIProxyAPI endpoint and key) must be readable by the Pi process, so commands
// run by the model can read it too.
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const home = homedir();
export const ISOLATION = {
  sandbox: "bwrap",
  version: 2,
  readOnlyHost: true,
  privateTmp: true,
  hide: [home],
  reveal: [
    join(home, ".bun/bin"),
    join(home, ".bun/install/global/node_modules"),
    join(home, ".nvm/versions/node/v24.21.0"),
    join(home, ".pi/agent/npm"),
    join(home, ".pi/agent/bin"),
    join(home, ".pi/agent/cliproxyapi.json"),
  ],
};

/** bwrap arguments: `dir` is the only writable path, `tools` (optional) is bound read-only, `cwd` is the start directory. */
export function sandboxArgs(isolation, dir, cwd, tools) {
  const args = ["--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc"];
  if (isolation.privateTmp) args.push("--tmpfs", "/tmp");
  for (const path of isolation.hide) if (existsSync(path)) args.push("--tmpfs", path);
  for (const path of isolation.reveal) if (existsSync(path)) args.push("--ro-bind", path, path);
  if (tools) args.push("--ro-bind", realpathSync(tools), tools);
  args.push("--bind", dir, dir, "--unshare-pid", "--unshare-ipc", "--die-with-parent", "--chdir", cwd, "--");
  return args;
}

/** PATH inside the sandbox: tools first, then the Pi/node runtime and the system directories. */
export function sandboxPath(tools) {
  return [tools, join(home, ".nvm/versions/node/v24.21.0/bin"), join(home, ".bun/bin"), "/usr/local/bin", "/usr/bin", "/bin"].filter(Boolean).join(":");
}
