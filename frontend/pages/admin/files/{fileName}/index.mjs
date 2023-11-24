import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { config } from '../../../../lib/config/index.mjs';
import { logger } from '../../../../lib/logger/index.mjs';
import authMiddleware from '../../../../lib/middleware/auth/index.mjs';

/**
 * @param {import('fs').Dirent} f
 * @param {string} absoluteFilePath
 * @returns {'binary' | 'directory' | 'text'}
 */
function getFileType(f, absoluteFilePath) {
  if (f.isDirectory()) {
    return 'directory';
  }
  const fileContents = readFileSync(absoluteFilePath);
  if (!/\ufffd/.test(fileContents.toString())) {
    return 'text';
  }
  return 'binary';
}

/** @type {import('../../../../lib/router/index.mjs').RenderFunction} */
const fileEditorHandler = async (event, session) => {
  logger.debug('file editor handler', { event, session });
  const requestedPath = event.pathParameters?.['*'] ?? '';
  const absoluteRequestedPath = `${config.filesDirectory}/${requestedPath}`;
  logger.debug('exploring files', { requestedPath, absoluteRequestedPath });
  if (!existsSync(absoluteRequestedPath)) {
    return {
      statusCode: 404,
      session,
    };
  }
  const absoluteRequestedPathStat = lstatSync(absoluteRequestedPath);
  let requestedDirectoryToExplore = '';
  if (absoluteRequestedPathStat.isDirectory()) {
    requestedDirectoryToExplore = requestedPath;
  } else if (requestedPath.includes('/')) {
    requestedDirectoryToExplore = requestedPath.replace(/\/[^/]+$/, '');
  }
  const absoluteDirectoryToExplore = `${config.filesDirectory}/${requestedDirectoryToExplore}`;
  logger.debug('exploring directory', { requestedDirectoryToExplore, absoluteDirectoryToExplore });

  /** @type {{ name: string; fileType: 'binary' | 'directory' | 'text'; } | undefined} */
  let currentFile;
  /** @type {string | undefined} */
  let currentFileContent;
  if (absoluteRequestedPathStat.isFile()) {
    const fileType = getFileType(absoluteRequestedPathStat, absoluteRequestedPath);
    currentFile = {
      name: requestedPath.replace(/.*\//, ''),
      fileType,
    };
    if (fileType === 'text') {
      currentFileContent = readFileSync(absoluteRequestedPath).toString();
    }
  } else {
    currentFile = {
      name: '',
      fileType: 'directory',
    };
    currentFileContent = undefined;
  }
  const files = readdirSync(absoluteDirectoryToExplore, { withFileTypes: true }).map((f) => {
    return {
      name: f.name,
      fileType: getFileType(f, `${absoluteDirectoryToExplore}/${f.name}`),
    };
  });

  const html = /* html */ `
    <style>
      file-editor {
        display: block;
        height: 100%;
      }
    </style>
    <header>
      <title-bar></title-bar>
    </header>
    <main>
      <section>
        <a href="/admin" style="display: block;">
          <button accent>
            Back to admin portal
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
      fileEditor: {
        currentDirectory: requestedDirectoryToExplore,
        files,
        currentFile,
        currentFileContent,
      },
    },
    session,
  };
};

export default authMiddleware(fileEditorHandler, { adminOnly: true });
