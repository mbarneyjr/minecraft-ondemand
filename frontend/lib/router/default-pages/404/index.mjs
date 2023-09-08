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
        title: 'Not Found',
        description: 'Not Found',
      },
    },
    session,
    statusCode: 404,
  };
}
