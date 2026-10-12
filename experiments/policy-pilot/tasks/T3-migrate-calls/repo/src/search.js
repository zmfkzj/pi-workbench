import { oldFetch as legacyFetch, fetchJson } from "./http.js";

export function search(term, options) {
  return legacyFetch("/search?q=" + encodeURIComponent(term), options);
}

export function suggest(prefix) {
  return fetchJson({ url: `/suggest/${prefix}` });
}
