import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('../../../../lib/router/index.mjs').RenderFunction} */
export default async function render(_, session) {
  return {
    body: readFileSync(`${dirname}/index.html`).toString(),
    headers: {
      'content-type': 'text/html',
    },
    state: {
      head: {
        title: 'Unauthorized',
        description: 'Unauthorized',
      },
    },
    session,
    statusCode: 403,
  };
}
