import Router from '@medley/router';
import { errorJson, logger } from '../logger/index.mjs';

import oauth2Handler from './default-pages/oauth2/idresponse/index.mjs';
import loginHandler from './default-pages/login/index.mjs';
import logoutHandler from './default-pages/logout/index.mjs';
import unauthorizedPage from './default-pages/403/index.mjs';
import notFoundPage from './default-pages/404/index.mjs';
import internalServerErrorPage from './default-pages/500/index.mjs';

/** @typedef RenderResult
 * @property {string} [body]
 * @property {import('./index.types.mjs').State} [state]
 * @property {import('../session/index.mjs').Session} session
 * @property {Record<string, string>} [headers]
 * @property {boolean} [isBase64Encoded]
 * @property {number} [statusCode]
 */

/** @callback RenderFunction
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @param {import('../session/index.mjs').Session} session
 * @returns {Promise<RenderResult>}
 */

/** @typedef Route
 * @property {Record<string, string>} params
 * @property {RenderFunction} handler
 */

const router = new Router();

/**
 * @param {string} method
 * @param {string} path
 * @param {RenderFunction} handler
 * @returns {void}
 */
export function addRoute(method, path, handler) {
  const store = router.register(path);
  store[method] = handler;
}

/**
 * @param {string} method
 * @param {string} path
 * @returns {Route | null}
 */
function getRoute(method, path) {
  const route = router.find(path);
  if (route === null) return null;
  const handler = route.store[method];
  if (!handler) return null;
  return {
    params: route.params,
    handler,
  };
}

// default routes
addRoute('GET', '/oauth2/idresponse', oauth2Handler);
addRoute('GET', '/login', loginHandler);
addRoute('GET', '/logout', logoutHandler);

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @param {import('../session/index.mjs').Session} session
 * @returns {Promise<RenderResult>}
 */
export async function routerHandler(event, session) {
  const route = getRoute(event.requestContext.http.method, event.rawPath);
  if (!route) return notFoundPage(event, session);

  try {
    /* eslint-disable-next-line no-param-reassign */
    event.pathParameters = route.params;
    const renderResult = await route.handler(event, session);
    if (renderResult.statusCode === 403) return unauthorizedPage(event, session);
    if (renderResult.statusCode === 404) return notFoundPage(event, session);
    return renderResult;
  } catch (err) {
    logger.error('error rendering page', { error: errorJson(err) });
    return internalServerErrorPage(event, session);
  }
}
