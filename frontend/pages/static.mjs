import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { mimeTypes } from '../lib/mime-types/index.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('../lib/router/index.js').RenderFunction} */
export default async function render(event, session) {
  const assetPath = event.rawPath.split('/static/')[1];
  try {
    const fileData = readFileSync(`${dirname}/static/${assetPath}`).toString('base64');
    const extension = path.extname(assetPath).substring(1);
    return {
      body: fileData,
      isBase64Decoded: true,
      headers: {
        'content-type': mimeTypes[extension] ?? 'application/octet-stream',
      },
      session,
    };
  } catch (err) {
    return {
      statusCode: 404,
      session,
    };
  }
}
