import enhance from '@enhance/ssr';

import { logger } from './lib/logger/index.mjs';
import { routerHandler } from './lib/router/index.mjs';
import { registerPages } from './pages/register.mjs';
import { parseSession, writeSession } from './lib/session/index.mjs';
import head from './head/index.mjs';
import elements from './elements/index.mjs';

/** @type {import('./index.js').handler} */
export async function handler(event) {
  logger.info('event', {}, {
    method: event.requestContext.http.method,
    path: event.requestContext.http.path,
  });

  registerPages();

  const parsedEvent = structuredClone(event);
  if (parsedEvent.isBase64Encoded && parsedEvent.body) {
    parsedEvent.body = Buffer.from(parsedEvent.body, 'base64').toString();
  }
  const session = await parseSession(parsedEvent.cookies);

  const renderResult = await routerHandler(parsedEvent, session);

  const headHtml = head(parsedEvent, renderResult.state);
  const html = enhance({
    elements,
    initialState: {
      ...renderResult.state,
      path: event.requestContext.http.path,
      session,
    },
  });
  const bodyHtml = renderResult.body ? html`${headHtml}${renderResult.body}` : undefined;

  const newSession = await writeSession(renderResult.session);

  /** @type {import('aws-lambda').APIGatewayProxyResultV2} */
  const result = {
    statusCode: renderResult.statusCode ?? 200,
    isBase64Encoded: renderResult.isBase64Decoded ?? false,
    headers: renderResult.headers ?? {},
    body: renderResult.isBase64Decoded ? renderResult.body : bodyHtml,
    cookies: newSession,
  };
  return result;
}
