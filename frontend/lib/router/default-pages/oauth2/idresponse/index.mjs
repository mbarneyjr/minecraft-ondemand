import { getTokens } from '../../../../auth/index.mjs';

/** @type {import('../../../../../lib/router/index.js').RenderFunction} */
export default async function render(event, session) {
  const authCode = event.queryStringParameters?.code;
  if (!authCode) {
    return {
      headers: {
        location: '/login',
      },
      session,
      statusCode: 302,
    };
  }
  const state = event.queryStringParameters?.state ? JSON.parse(Buffer.from(event.queryStringParameters.state, 'base64').toString()) : undefined;
  const tokenResponse = await getTokens(event, authCode);
  return {
    headers: {
      location: state?.requestedPath ?? '/',
    },
    session: {
      ...session,
      idToken: tokenResponse.id_token,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
    },
    statusCode: 302,
  };
}
