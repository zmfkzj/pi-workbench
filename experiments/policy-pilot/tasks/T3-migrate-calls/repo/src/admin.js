import * as http from "./http.js";

const base = "/admin";

export function listAudits(path, opts) {
  return http.oldFetch(base + path, opts);
}

export function ping() {
  return http.oldFetch(`${base}/ping`);
}
