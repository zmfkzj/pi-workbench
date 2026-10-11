import { fileURLToPath } from "node:url";
import { registerWorkbench } from "./lib/runtime.js";

export default function workbench(pi) {
  registerWorkbench(pi, fileURLToPath(new URL(".", import.meta.url)));
}
