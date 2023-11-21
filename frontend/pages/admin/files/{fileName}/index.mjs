import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { config } from '../../../../lib/config/index.mjs';
import authMiddleware from '../../../../lib/middleware/auth/index.mjs';

/** @type {import('../../../../lib/router/index.mjs').RenderFunction} */
const fileEditorHandler = async (event, session) => {
  const requestedPath = event.pathParameters?.['*'] ?? '';
  const currentFilePath = requestedPath ? `${config.filesDirectory}/${requestedPath}` : config.filesDirectory;
  if (!existsSync(currentFilePath)) {
    return {
      statusCode: 404,
      session,
    };
  }
  const requestedFile = lstatSync(currentFilePath);
  const files = requestedFile.isDirectory()
    ? readdirSync(currentFilePath, { withFileTypes: true }).map((f) => {
        const filePath = requestedPath ? `${requestedPath}/${f.name}` : f.name;
        /** @type {'binary' | 'directory' | 'text'} */
        let fileType = 'binary';
        if (f.isDirectory()) {
          fileType = 'directory';
        } else {
          const fileContents = readFileSync(filePath);
          if (!/\ufffd/.test(fileContents.toString())) {
            fileType = 'text';
          }
        }
        return {
          name: f.name,
          path: filePath,
          fileType,
        };
      })
    : [];

  const html = /* html */ `
    <style>
      file-editor {
        display: block;
        height: 200px;
      }
    </style>
    <header>
      <title-bar></title-bar>
    </header>
    <main>
      <section>
        <a href="/admin" style="display: block;">
          <button accent>
            Back
          </button>
        </a>
        <file-editor></file-editor>
      </section>
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
