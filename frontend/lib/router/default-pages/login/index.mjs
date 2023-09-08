import { encode } from 'querystring';
import { config } from '../../../config/index.mjs';
import { isLoggedIn, sessionNeedsRefresh } from '../../../middleware/auth/index.mjs';

/** @type {import('../../../../lib/router/index.mjs').RenderFunction} */
export default async function render(event, session) {
  if (isLoggedIn(session) && !sessionNeedsRefresh(session)) {
    return {
      headers: {
        location: '/',
      },
      session,
      statusCode: 302,
    };
  }
  const requestedPath = event.queryStringParameters?.redirect ?? '/';
  const loginParameters = {
    client_id: config.auth.clientId,
    scope: config.auth.scope,
    redirect_uri: `${event.requestContext.domainName.includes('localhost') ? 'http' : 'https'}://${event.requestContext.domainName}/oauth2/idresponse`,
    response_type: 'code',
    state: Buffer.from(JSON.stringify({ requestedPath })).toString('base64'),
  };
  const location = `${config.auth.baseUrl}/login?${encode(loginParameters)}`;
  return {
    headers: {
      location,
    },
    session,
    statusCode: 302,
  };
}
