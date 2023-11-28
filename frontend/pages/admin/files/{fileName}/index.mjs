import { createHash } from 'crypto';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { config } from '../../../../lib/config/index.mjs';
import { logger } from '../../../../lib/logger/index.mjs';
import authMiddleware from '../../../../lib/middleware/auth/index.mjs';

/** @typedef {import('../../../../lib/router/index.types.mjs').FileEditorState} FileEditorState */

/**
 * @param {import('fs').Dirent | import('fs').Stats} f
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
  const requestedPath = decodeURIComponent(event.pathParameters?.['*'] ?? '');
  const absoluteRequestedPath = `${config.filesDirectory}/${requestedPath}`;
  logger.debug('exploring files', { requestedPath, absoluteRequestedPath });

  // default to a file not found page
  let fileEditorHtml = /* html */ `
    <p>File not found</p>
    <p>Would you like to create it?</p>
    <form method="post" enctype="multipart/form-data">
      <input type="hidden" name="file-name" value="${encodeURIComponent(requestedPath)}" />
      <input for="file-editor-form" type="file" id="file" name="file">
      <input type="hidden" name="file-source" id="file-source" value="" />
      <button primary type="submit">Create</button>
    </form>
  `;
  /** @type {FileEditorState | undefined} */
  let fileEditorState;

  if (existsSync(absoluteRequestedPath)) {
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
    const fileType = getFileType(absoluteRequestedPathStat, absoluteRequestedPath);
    if (fileType !== 'directory') {
      currentFile = {
        name: requestedPath.replace(/.*\//, ''),
        fileType,
      };
      if (fileType === 'text') {
        currentFileContent = readFileSync(absoluteRequestedPath).toString();
      } else {
        currentFileContent = createHash('md5').update(readFileSync(absoluteRequestedPath)).digest('hex');
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
    fileEditorHtml = /* html */ `
      <file-editor></file-editor>
    `;
    fileEditorState = {
      currentDirectory: requestedDirectoryToExplore,
      files,
      currentFile,
      currentFileContent,
    };
  }

  const html = /* html */ `
    <style>
      section {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .title {
        flex: 0 0 auto;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
      }
      file-editor {
        min-height: 40em;
        flex: 1 1 auto;
        width: 100%;
      }
    </style>
    <header>
      <title-bar></title-bar>
    </header>
    <main>
      <section>
        <div class="title">
          <a href="/admin"><button accent>Back</button></a>
          <h1>File Explorer</h1>
          <div></div>
        </div>
        ${fileEditorHtml}
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
      fileEditor: fileEditorState,
    },
    session,
  };
};

export default authMiddleware(fileEditorHandler, { adminOnly: true });
