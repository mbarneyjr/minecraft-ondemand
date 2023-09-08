/**
 * @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel
 * @callback LoggerFunction
 * @param {string} message
 * @param {import('./types.mjs').LogData} [data]
 * @param {import('./types.mjs').RequestContext} [requestContext]
 * @returns {import('./types.mjs').Log}
 */

/**
 * @param {string | undefined} input
 * @returns {number}
 */
function getLogLevel(input) {
  /** @type {Record<LogLevel, number>} */
  const logLevelMap = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };
  if (input !== undefined && input in logLevelMap) return logLevelMap[/** @type {LogLevel} */ (input)];
  return logLevelMap.debug;
}

/** @type {import('./types.mjs').RequestContext} */
const globalRequestContext = {
  method: null,
  path: null,
};

/**
 * @param {LogLevel} level
 * @param {string} message
 * @param {import('./types.mjs').LogData} [data]
 * @param {import('./types.mjs').RequestContext} [requestContext]
 * @returns {import('./types.mjs').Log}
 */
export function log(level, message, data, requestContext) {
  if (requestContext?.method) globalRequestContext.method = requestContext.method;
  if (requestContext?.path) globalRequestContext.path = requestContext.path;

  /** @type {import('./types.mjs').Log} */
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

/** @type {Record<LogLevel, LoggerFunction>} */
export const logger = {
  debug: (message, data, requestContext) => log('debug', message, data, requestContext),
  info: (message, data, requestContext) => log('info', message, data, requestContext),
  warn: (message, data, requestContext) => log('warn', message, data, requestContext),
  error: (message, data, requestContext) => log('error', message, data, requestContext),
};

/**
 * @param {unknown} err
 * @returns {Record<string, unknown>}
 */
export const errorJson = (err) => JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
