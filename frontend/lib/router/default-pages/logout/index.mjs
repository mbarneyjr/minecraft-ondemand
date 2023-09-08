/** @type {import('../../../../lib/router/index.mjs').RenderFunction} */
export default async function render(_, session) {
  return {
    headers: {
      location: '/',
    },
    session: {
      ...session,
      idToken: null,
      accessToken: null,
      refreshToken: null,
    },
    statusCode: 302,
  };
}
