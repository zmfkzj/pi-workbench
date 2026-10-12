// Per-run access boundary for the policy pilot (stage 3 onward), built with bubblewrap.
//
// Inside the sandbox the host file system is read-only, /tmp is a private tmpfs, and only the run's own directory is
// bound back writable. Hidden paths are covered by empty tmpfs mounts (the repository with the task graders and
// reference solutions, the Pi agent directory with session records and installed packages); the provider extension,
// Pi's helper binaries and the provider config are bound back read-only. Network access is kept for the local
// provider endpoint. This needs unprivileged user namespaces (bwrap); the self-check probes the boundary without a model.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_ISOLATION = {
  sandbox: "bwrap",
  readOnlyHost: true,
  privateTmp: true,
  hide: ["~/Code", "~/.pi/agent"],
  reveal: ["~/.pi/agent/npm", "~/.pi/agent/bin", "~/.pi/agent/cliproxyapi.json"],
};

const expand = (path) => (path.startsWith("~/") ? join(homedir(), path.slice(2)) : path);

/** bwrap arguments that run a command with `dir` as the only writable path and `cwd` as working directory. */
export function sandboxArgs(isolation, dir, cwd) {
  const args = ["--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc"];
  if (isolation.privateTmp) args.push("--tmpfs", "/tmp");
  for (const path of isolation.hide.map(expand)) if (existsSync(path)) args.push("--tmpfs", path);
  for (const path of isolation.reveal.map(expand)) if (existsSync(path)) args.push("--ro-bind", path, path);
  args.push("--bind", dir, dir, "--unshare-pid", "--unshare-ipc", "--die-with-parent", "--chdir", cwd, "--");
  return args;
}
