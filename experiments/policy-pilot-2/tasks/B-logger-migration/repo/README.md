# ops-services

Service and job modules. Each exports `run(input)`; `src/index.js` lists them.

Logging goes through `src/log.js`. Since 4.0 the API is `logger.debug/info/warn/error(message, context)`; `log(level, message, context)` is deprecated and kept only for plugins outside this repository.
