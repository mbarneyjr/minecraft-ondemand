import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import authMiddleware from '../../lib/middleware/auth/index.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('../../lib/router/index.mjs').RenderFunction} */
const adminPortalHandler = async (event, session) => {
  return {
    body: readFileSync(`${dirname}/index.html`).toString(),
    headers: {
      'content-type': 'text/html',
    },
    state: {
      head: {
        title: 'Admin',
        description: 'Administrator portal',
      },
    },
    session,
  };
};

export default authMiddleware(adminPortalHandler, { adminOnly: true });
