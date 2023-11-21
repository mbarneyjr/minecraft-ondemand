import { config } from '../lib/config/index.mjs';
import { logger } from '../lib/logger/index.mjs';

export const ELEMENT_NAME = 'file-editor';

/**
 * @param {{ name: string, path: string, fileType: 'binary' | 'text' | 'directory' }} file
 */
function fileListItem(file) {
  const displayName = `${file.name}${file.fileType === 'directory' ? '/' : ''}`;
  const fileUrl = file.fileType === 'binary' ? `/admin/file-source/${file.path}` : `/admin/files/${file.path}`;
  return /* html */ `
    <li>
      <a href="${fileUrl}">${displayName}</a>
    </li>
  `;
}

/**
 * @param {Array<{ name: string, path: string, fileType: 'binary' | 'text' | 'directory' }>} files
 */
function fileList(files) {
  return /* html */ `
    <style>
      ul {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        background-color: var(--background);
        color: var(--text);
        border: 1px solid var(--text);
      }
      li:hover {
        background-color: var(--text);
        color: var(--background);
      }
      li a {
        display: block;
        font-family: monospace;
      }
    </style>
    <ul>
      ${files.map((f) => fileListItem(f)).join('\n')}
    </ul>
  `;
}

/**
 * @param {string} currentPath
 */
function fileEditor(currentPath) {
  const fileSourceUrl = `${config.appEndpoint}/admin/file-source/${currentPath}`;
  return /* html */ `
    <style>
      form {
        height: 100%;
      }
      textarea {
        width: 100%;
        height: 100%;
        font-family: monospace;
        background-color: var(--background);
        color: var(--text);
      }
    </style>
    <form id="file-editor-form" action="/admin/files/${currentPath}" method="post">
      <textarea form="file-editor-form" name="file" id="file" cols="35" wrap="soft"></textarea>
      <button type="submit">Save</button>
    </form>
    <script>
      async function setup() {
        const fileSource = await (await fetch('${fileSourceUrl}')).text();
        const editor = document.getElementById('file');
        editor.value = fileSource;
      }
      setup();
    </script>
  `;
}

/** @type {import('@enhance/types').EnhanceElemFn} */
export function element({ html, state }) {
  const appState = /** @type {import('../lib/router/index.types.mjs').State} */ (state.store);
  const filesDirectory = appState.filesDirectory;
  const currentPath = appState.currentPath;
  const isDirectory = appState.isDirectory;
  const files = appState.files;

  if (filesDirectory === undefined || currentPath === undefined || isDirectory === undefined || files === undefined) {
    logger.error('missing state', { filesDirectory, currentPath, isDirectory, files });
    throw new Error('missing state');
  }

  const parentPaths = currentPath.split('/');
  const parentPathLinks = parentPaths
    .map((_, i) => {
      const path = parentPaths.slice(0, i + 1).join('/');
      return /* html */ `
        <a style="display: inline" href="/admin/files/${path}">${parentPaths[i]}</a>
      `;
    })
    .join('/');

  return html`
    <style>
      h1 {
        font-family: monospace;
        font-size: 100%;
        padding: 1rem 0;
      }
      h1 a {
        color: var(--text);
        padding: 0.25rem 0rem;
      }
      h1 a:hover {
        text-decoration: underline;
      }
    </style>
    <h1>/ <a href="/admin/files">root</a> / ${parentPathLinks}</h1>

    ${isDirectory ? fileList(files) : fileEditor(currentPath)}
  `;
}
