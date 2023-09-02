/** @type {import('./index.js').getLogLevel} */
function getLogLevel(input) {
  /** @type {Record<import('./index.js').LogLevel, number>} */
  const logLevelMap = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };
  if (input !== undefined && input in logLevelMap) return logLevelMap[/** @type {import('./index.js').LogLevel} */ (input)];
  return logLevelMap.debug;
}

/** @type {import('./index.js').RequestContext} */
const globalRequestContext = {
  method: null,
  path: null,
};

/** @type {import('./index.js').log} */
export function log(level, message, data, requestContext) {
  if (requestContext?.method) globalRequestContext.method = requestContext.method;
  if (requestContext?.path) globalRequestContext.path = requestContext.path;

  /** @type {import('./index.js').Log} */
  const logLine = {
    message,
    data,
    request: globalRequestContext,
  };

  if (getLogLevel(process.env.LOG_LEVEL) <= getLogLevel(level)) {
    /* eslint-disable-next-line no-console */
    if (process.env.NODE_ENV !== 'test') console[level](JSON.stringify(logLine));
  }
  return logLine;
}

/** @type {Record<import('./index.js').LogLevel, import('./index.js').LoggerFunction>} */
export const logger = {
  debug: (message, data, requestContext) => log('debug', message, data, requestContext),
  info: (message, data, requestContext) => log('info', message, data, requestContext),
  warn: (message, data, requestContext) => log('warn', message, data, requestContext),
  error: (message, data, requestContext) => log('error', message, data, requestContext),
};

/** @type {import('./index.js').errorJson} */
export const errorJson = (err) => JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
