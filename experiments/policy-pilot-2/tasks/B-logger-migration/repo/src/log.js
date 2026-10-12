// Logging for all services. Sinks receive { level, message, context }.
export const LEVELS = ["debug", "info", "warn", "error"];
const sinks = [];

export function addSink(sink) {
  sinks.push(sink);
  return () => sinks.splice(sinks.indexOf(sink), 1);
}

function emit(level, message, context) {
  if (!LEVELS.includes(level)) throw new RangeError(`unknown level: ${level}`);
  for (const sink of sinks) sink({ level, message, context });
}

/** @deprecated since 4.0: use logger.<level>(message, context). Still exported for plugins outside this repository. */
export function log(level, message, context) {
  emit(level, message, context);
}

/** logger.debug/info/warn/error(message, context) */
export const logger = Object.freeze(Object.fromEntries(LEVELS.map((level) => [level, (message, context) => emit(level, message, context)])));
