import he from 'he';
import { logger } from '../lib/logger/index.mjs';

export const ELEMENT_NAME = 'file-editor';

/** @type {import('@enhance/types').EnhanceElemFn} */
export function element({ html, state }) {
  const appState = /** @type {import('../lib/router/index.types.mjs').State} */ (state.store);
  const fileEditorState = appState.fileEditor;
  logger.debug('file editor element', { fileEditorState });
  if (fileEditorState === undefined) {
    logger.error('missing state for file editor', { fileEditorState });
    throw new Error('missing state');
  }

  const pathParts = fileEditorState.currentDirectory.split('/');
  const homeLink = /* html */ `<a href="/admin/files">minecraft</a>`;
  const pathLinks = pathParts.map((part, index) => {
    const path = pathParts.slice(0, index + 1).join('/');
    return /* html */ `
      <a href="/admin/files/${path}">${part}</a>
    `;
  });

  const fileElements = fileEditorState.files.map((f) => {
    const isCurrentFile = fileEditorState.currentFile?.name === f.name;
    const link =
      fileEditorState.currentDirectory === ''
        ? `/admin/files/${f.name}`
        : `/admin/files/${fileEditorState.currentDirectory}/${f.name}`;

    return /* html */ `
      <li ${isCurrentFile ? 'active' : ''}>
        <a href="${link}">${f.fileType === 'directory' ? `${f.name}/` : f.name}</a>
      </li>
    `;
  });

  let fileEditorHtml = '';
  if (fileEditorState.currentFile) {
    const filePath = `${fileEditorState.currentDirectory}/${fileEditorState.currentFile.name}`;
    if (fileEditorState.currentFile.fileType === 'text' && fileEditorState.currentFileContent) {
      fileEditorHtml = /* html */ `
        <form id="file-editor-form" class="editor" action="/admin/files/${filePath}" method="post" enctype="multipart/form-data">
          <textarea form="file-editor-form" class="editor" name="file-source" id="file-source" wrap="off">${he.escape(
            fileEditorState.currentFileContent,
          )}</textarea>
          <div>
            <button type="submit">Save</button>
          </div>
        </form>
      `;
    } else if (fileEditorState.currentFile.fileType === 'binary') {
      fileEditorHtml = /* html */ `
        <form id="file-editor-form" class="editor" action="/admin/files/${filePath}" method="post" enctype="multipart/form-data">
          <textarea readonly form="file-editor-form" class="editor" name="file-source" id="file-source" wrap="off">hash: ${he.escape(
            `${fileEditorState.currentFileContent}`,
          )}</textarea>
          <div>
            <a href="/admin/file-source/${filePath}" download>
              <button primary>Download</button>
            </a>
            <input type="file" id="file" name="file">
            <button type="submit">Save</button>
          </div>
        </form>
      `;
    }
  }

  return html`
    <style>
      .file-path {
        font-family: monospace;
        font-size: 100%;
        font-weight: bold;
        padding: 1rem 0;
      }
      .file-path a {
        color: var(--text);
        padding: 0.25rem 0rem;
      }
      .file-path a:hover {
        text-decoration: underline;
      }
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
      li[active] {
        background-color: var(--text);
        color: var(--background);
      }
      li a {
        display: block;
        font-family: monospace;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      textarea {
        width: 100%;
        height: 100%;
        font-family: monospace;
        background-color: var(--background);
        color: var(--text);
      }
      .container {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      ul {
        flex-grow: 1;
      }
      .editor {
        flex-grow: 10;
      }
    </style>
    <div class="file-path">/ ${homeLink} / ${pathLinks.join(' / ')}</div>
    <div class="container">
      <ul>
        ${fileElements.join('\n')}
      </ul>
      ${fileEditorHtml}
    </div>
  `;
}
