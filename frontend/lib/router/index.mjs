import Router from '@medley/router';
import { errorJson, logger } from '../logger/index.mjs';

import oauth2Handler from './default-pages/oauth2/idresponse/index.mjs';
import loginHandler from './default-pages/login/index.mjs';
import logoutHandler from './default-pages/logout/index.mjs';
import notFoundPage from './default-pages/404/index.mjs';
import internalServerErrorPage from './default-pages/500/index.mjs';

const router = new Router();

/** @type {import('./index.js').addRoute} */
export function addRoute(method, path, handler) {
  const store = router.register(path);
  store[method] = handler;
}

/** @type {import('./index.js').getRoute} */
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

/** @type {import('./index.js').routerHandler} */
export async function routerHandler(event, session) {
  const route = getRoute(event.requestContext.http.method, event.rawPath);
  if (!route) return notFoundPage(event, session);

  try {
    /* eslint-disable-next-line no-param-reassign */
    event.pathParameters = route.params;
    const renderResult = await route.handler(event, session);
    if (renderResult.statusCode !== 404) return renderResult;
    return notFoundPage(event, session);
  } catch (err) {
    logger.error('error rendering page', { error: errorJson(err) });
    return internalServerErrorPage(event, session);
  }
}
