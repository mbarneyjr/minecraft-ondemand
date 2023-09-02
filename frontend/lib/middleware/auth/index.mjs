import { encode } from 'querystring';
import jwt from 'node-webtokens';
import { refreshTokens } from '../../auth/index.mjs';

/** @type {import('./index.js').isLoggedIn} */
export function isLoggedIn(session) {
  if (!session.idToken || !session.accessToken || !session.refreshToken) {
    return false;
  }
  return true;
}

/** @type {import('./index.js').sessionNeedsRefresh} */
export function sessionNeedsRefresh(session) {
  const parsed = jwt.parse(session.idToken);
  if (!parsed.payload) {
    return true;
  }
  const secondsUntilExpiration = parsed.payload.exp - (new Date().getTime() / 1000);
  const FIVE_MINUTES = 60 * 5;
  if (secondsUntilExpiration < FIVE_MINUTES) {
    return true;
  }
  return false;
}

/** @type {import('./index.js').refreshSession} */
async function refreshSession(session) {
  const newSession = structuredClone(session);
  const tokenResponse = await refreshTokens(newSession.refreshToken);
  if (tokenResponse.error) {
    throw new Error(tokenResponse.error);
  }
  newSession.idToken = tokenResponse.id_token;
  newSession.accessToken = tokenResponse.id_token;
  return newSession;
}

/** @type {import('./index.js').redirectToLogin} */
function redirectToLogin(session, requestedPath) {
  return {
    headers: {
      location: `/login?${encode({ redirect: requestedPath })}`,
    },
    session,
    statusCode: 302,
  };
}

/** @type {import('./index.js').AuthMiddleWare} */
export default function authMiddleware(originalRenderer) {
  /** @type {import('../../router/index.js').RenderFunction} */
  return async (event, session) => {
    const newSession = structuredClone(session);
    if (!isLoggedIn(newSession)) {
      return redirectToLogin(newSession, event.rawPath);
    }
    if (!sessionNeedsRefresh(newSession)) {
      return originalRenderer(event, newSession);
    }
    try {
      const refreshedSession = await refreshSession(newSession);
      return originalRenderer(event, refreshedSession);
    } catch (err) {
      return redirectToLogin({
        ...newSession,
        idToken: null,
        accessToken: null,
        refreshToken: null,
      }, event.rawPath);
    }
  };
}
