/** Transport used by every request; tests replace it. */
export const transport = { send: async (request) => ({ ok: true, request }) };

/**
 * @deprecated since 3.0. Use fetchJson({ url, ...options }). Kept exported for external callers.
 */
export async function oldFetch(url, options = {}) {
  return fetchJson({ url, ...options });
}

export async function fetchJson({ url, method = "GET", headers = {}, body } = {}) {
  return transport.send({ url, method, headers, body });
}
