import { existsSync, lstatSync, readdirSync } from 'fs';
import { config } from '../../../../lib/config/index.mjs';
import authMiddleware from '../../../../lib/middleware/auth/index.mjs';

/** @type {import('../../../../lib/router/index.mjs').RenderFunction} */
const fileEditorHandler = async (event, session) => {
  const requestedPath = event.pathParameters?.['*'] ?? '';
  const filePath = requestedPath ? `${config.filesDirectory}/${requestedPath}` : config.filesDirectory;
  if (!existsSync(filePath)) {
    return {
      statusCode: 404,
      session,
    };
  }
  const requestedFile = lstatSync(filePath);
  const files = requestedFile.isDirectory()
    ? readdirSync(filePath, { withFileTypes: true }).map((f) => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        path: requestedPath ? `${requestedPath}/${f.name}` : f.name,
      }))
    : [];

  const html = /* html */ `
    <style>
      file-editor {
        display: block;
        height: 200px;
      }
    </style>
    <title-bar></title-bar>
    <main>
      <file-editor></file-editor>
    </main>
  `;

  return {
    body: html,
    headers: {
      'content-type': 'text/html',
    },
    state: {
      head: {
        title: `Admin - ${requestedPath}`,
        description: 'Administrator portal file explorer',
      },
      filesDirectory: config.filesDirectory,
      isDirectory: requestedFile.isDirectory(),
      currentPath: requestedPath,
      files,
    },
    session,
  };
};

export default authMiddleware(fileEditorHandler, { adminOnly: true });
