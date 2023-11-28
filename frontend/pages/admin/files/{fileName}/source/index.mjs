import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { config } from '../../../../../lib/config/index.mjs';
import authMiddleware from '../../../../../lib/middleware/auth/index.mjs';
import { mimeTypes } from '../../../../../lib/mime-types/index.mjs';

/** @type {import('../../../../../lib/router/index.mjs').RenderFunction} */
const fileEditorHandler = async (event, session) => {
  const fileName = decodeURIComponent(event.pathParameters?.['*'] || '');
  if (!fileName || !existsSync(`${config.filesDirectory}/${fileName}`)) {
    return {
      statusCode: 404,
      session,
    };
  }
  const source = readFileSync(`${config.filesDirectory}/${fileName}`).toString('base64');
  const extension = path.extname(fileName).substring(1);
  return {
    body: source,
    headers: {
      'content-type': mimeTypes[extension] ?? 'application/octet-stream',
    },
    isBase64Encoded: true,
    state: {
      head: {
        title: `Admin - ${fileName}`,
        description: 'Administrator portal file explorer',
      },
    },
    session,
  };
};

export default authMiddleware(fileEditorHandler, { adminOnly: true });
