import cookie from 'cookie';
import jwt from 'node-webtokens';

export const ALG = 'dir';
export const ENC = 'A128GCM';
export const SESSION_KEY = process.env.SESSION_KEY ?? Buffer.from('1234567890123456').toString('base64');
export const WEEK = 604800;

/** @type {import('./index.js').parseSession} */
export async function parseSession(cookies) {
  /** @type {import('./index.js').Session} */
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

/** @type {import('./index.js').writeSession} */
export async function writeSession(session) {
  return Object.entries(session ?? {}).filter((entry) => entry[1] !== undefined).map(([key, value]) => {
    const generated = jwt.generate(ALG, ENC, { value }, SESSION_KEY);
    return cookie.serialize(key, generated, {
      path: '/',
      httpOnly: true,
    });
  });
}
