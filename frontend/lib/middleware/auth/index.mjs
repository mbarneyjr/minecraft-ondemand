import { encode } from 'querystring';
import jwt from 'node-webtokens';
import { refreshTokens } from '../../auth/index.mjs';

/**
 * @param {import('../../session/index.mjs').Session} session
 * @returns {session is import('./types.mjs').LoggedInSession}
 */
export function isLoggedIn(session) {
  if (!session.idToken || !session.accessToken || !session.refreshToken) {
    return false;
  }
  return true;
}

/**
 * @param {import('./types.mjs').LoggedInSession} session
 * @param {string} group
 * @returns {boolean}
 */
export function sessionIsMember(session, group) {
  if (session.idToken) {
    const parsed = jwt.parse(session.idToken);
    if (!parsed.payload) {
      return false;
    }
    const groups = parsed.payload['cognito:groups'] ?? [];
    return groups.includes(group);
  }
  return false;
}

/**
 * @param {import('./types.mjs').LoggedInSession} session
 * @returns {boolean}
 */
export function sessionNeedsRefresh(session) {
  const parsed = jwt.parse(session.idToken);
  if (!parsed.payload) {
    return true;
  }
  const secondsUntilExpiration = parsed.payload.exp - new Date().getTime() / 1000;
  const FIVE_MINUTES = 60 * 5;
  if (secondsUntilExpiration < FIVE_MINUTES) {
    return true;
  }
  return false;
}

/**
 * @param {import('./types.mjs').LoggedInSession} session
 * @returns {Promise<import('./types.mjs').LoggedInSession>}
 */
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

/**
 * @param {import('../../session/index.mjs').Session} session
 * @param {string} requestedPath
 * @returns {import('../../router/index.mjs').RenderResult}
 */
function redirectToLogin(session, requestedPath) {
  return {
    headers: {
      location: `/login?${encode({ redirect: requestedPath })}`,
    },
    session,
    statusCode: 302,
  };
}

/**
 * @param {import('../../router/index.mjs').RenderFunction} originalRenderer
 * @param {object} [options]
 * @param {boolean} [options.adminOnly]
 * @returns {import('../../router/index.mjs').RenderFunction}
 */
export default function authMiddleware(originalRenderer, options) {
  /** @type {import('../../router/index.mjs').RenderFunction} */
  return async (event, session) => {
    const newSession = structuredClone(session);
    if (!isLoggedIn(newSession)) {
      return redirectToLogin(newSession, event.rawPath);
    }
    const loggedInSession = sessionNeedsRefresh(newSession) ? await refreshSession(newSession) : newSession;
    try {
      if (options?.adminOnly && !sessionIsMember(loggedInSession, 'admins')) {
        return {
          statusCode: 403,
          session: newSession,
        };
      }
      return originalRenderer(event, loggedInSession);
    } catch (err) {
      return redirectToLogin(
        {
          ...newSession,
          idToken: null,
          accessToken: null,
          refreshToken: null,
        },
        event.rawPath,
      );
    }
  };
}
