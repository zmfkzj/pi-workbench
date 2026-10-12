export const DEFAULTS = { retries: 3, timeout_ms: 1000, url: "http://localhost/health" };

/** Settings for a probe: config values over defaults; invalid numbers fall back to the default. */
export function resolveSettings(config = {}) {
  const settings = { ...DEFAULTS, ...config };
  const retries = Number.isInteger(settings.retries) && settings.retries >= 0 ? settings.retries : DEFAULTS.retries;
  const timeout = Number.isInteger(settings.timeout_ms) && settings.timeout_ms > 0 ? settings.timeout_ms : DEFAULTS.timeout_ms;
  return { ...settings, retries: retries || DEFAULTS.retries, timeout_ms: timeout };
}

/** Run a probe with `send(url, timeout)`; returns { ok, attempts }. One first attempt plus up to `retries` retries. */
export async function runProbe(settings, send) {
  let attempts = 0;
  for (let i = 0; i <= settings.retries; i++) {
    attempts++;
    if (await send(settings.url, settings.timeout_ms)) return { ok: true, attempts };
  }
  return { ok: false, attempts };
}
