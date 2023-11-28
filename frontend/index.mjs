/* eslint-disable @typescript-eslint/no-unused-vars */
import enhance from '@enhance/ssr';
import styleTransform from '@enhance/enhance-style-transform';

import { logger } from './lib/logger/index.mjs';
import { routerHandler } from './lib/router/index.mjs';
import { registerPages } from './pages/register.mjs';
import { parseSession, writeSession } from './lib/session/index.mjs';
import head from './head/index.mjs';
import elements from './elements/index.mjs';

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @param {import('aws-lambda').Context} context
 * @returns {Promise<import('aws-lambda').APIGatewayProxyStructuredResultV2>}
 */
export async function handler(event, context) {
  logger.info(
    'event',
    { event },
    {
      method: event.requestContext.http.method,
      path: event.requestContext.http.path,
    },
  );

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
    styleTransforms: [styleTransform],
    initialState: {
      ...renderResult.state,
      path: event.requestContext.http.path,
      session,
    },
  });

  /** @type {string} */
  let bodyHtml;
  if (renderResult.headers?.['content-type'] === 'text/html') {
    bodyHtml = renderResult.body ? html`${headHtml}${renderResult.body}` : undefined;
  } else {
    bodyHtml = renderResult.body ?? '';
  }

  const newSession = await writeSession(renderResult.session);

  /** @type {import('aws-lambda').APIGatewayProxyResultV2} */
  const result = {
    statusCode: renderResult.statusCode ?? 200,
    isBase64Encoded: renderResult.isBase64Encoded ?? false,
    headers: renderResult.headers ?? {},
    body: renderResult.isBase64Encoded ? renderResult.body : bodyHtml,
    cookies: newSession,
  };
  return result;
}
