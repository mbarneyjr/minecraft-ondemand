import { config } from '../lib/config/index.mjs';

export const ELEMENT_NAME = 'file-editor';

/**
 * @param {{ name: string, isDirectory: boolean, path: string }} file
 */
function fileListItem(file) {
  const displayName = `${file.name}${file.isDirectory ? '/' : ''}`;
  const fileUrl = `/admin/files/${file.path}`;
  return /* html */ `
    <li>
      <a href="${fileUrl}">${displayName}</a>
    </li>
  `;
}

/**
 * @param {Array<{ name: string, isDirectory: boolean, path: string }>} files
 */
function fileList(files) {
  return /* html */ `
    <style>
      ul {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      li {
        background-color: #eee;
      }
      li:hover {
        background-color: #ccc;
      }
      li a {
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
      }
    </style>
    <form id="file-editor-form" action="/admin/files${currentPath}" method="post">
      <textarea form="file-editor-form" name="file" id="file" cols="35" wrap="soft"></textarea>
      <input type="submit" value="Save" />
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

  if (!filesDirectory || !currentPath || !isDirectory || !files) throw new Error('missing state');

  return html`
    <style>
      h1 {
        font-family: monospace;
        font-size: 100%;
        font-weight: normal;
      }
    </style>
    <h1><pre>${filesDirectory}/${currentPath}</pre></h1>

    ${isDirectory ? fileList(files) : fileEditor(currentPath)}
  `;
}
