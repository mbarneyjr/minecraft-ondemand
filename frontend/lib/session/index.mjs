import cookie from 'cookie';
import jwt from 'node-webtokens';

export const ALG = 'dir';
export const ENC = 'A128GCM';
export const SESSION_KEY = process.env.SESSION_KEY ?? Buffer.from('1234567890123456').toString('base64');
export const WEEK = 604800;

/**
 * @typedef {Record<string, string | null>} Session
 */

/**
 * @param {Array<string> | undefined} cookies
 * @returns {Promise<Session>}
 */
export async function parseSession(cookies) {
  /** @type {Session} */
  const session = {};
  /* eslint-disable-next-line no-restricted-syntax */
  for (const requestCookie of cookies ?? []) {
    const result = cookie.parse(requestCookie);
    /* eslint-disable-next-line no-restricted-syntax */
    for (const [key, value] of Object.entries(result)) {
      const parsed = jwt.parse(value);
      if (!parsed.error) {
        parsed.setTokenLifetime(WEEK).verify(SESSION_KEY);
        if (parsed.payload) session[key] = parsed.payload.value;
      }
    }
  }
  return session;
}

/**
 * @param {Session} session
 * @returns {Promise<Array<string>>}
 */
export async function writeSession(session) {
  return Object.entries(session ?? {}).filter((entry) => entry[1] !== undefined).map(([key, value]) => {
    const generated = jwt.generate(ALG, ENC, { value }, SESSION_KEY);
    return cookie.serialize(key, generated, {
      path: '/',
      httpOnly: true,
    });
  });
}
