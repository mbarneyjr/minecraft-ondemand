import he from 'he';
import { logger } from '../lib/logger/index.mjs';

export const ELEMENT_NAME = 'file-editor';

/** @type {import('@enhance/types').EnhanceElemFn} */
export function element({ html, state }) {
  const appState = /** @type {import('../lib/router/index.types.mjs').State} */ (state.store);
  const fileEditorState = appState.fileEditor;
  logger.debug('rendering file editor element', { fileEditorState });
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

  const fileElements = fileEditorState.files
    .sort((f) => (f.fileType === 'directory' ? -1 : 1))
    .map((f) => {
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
  if (fileEditorState.currentFile && fileEditorState.currentFileContent !== undefined) {
    const filePath =
      fileEditorState.currentDirectory === ''
        ? `${fileEditorState.currentFile.name}`
        : `${fileEditorState.currentDirectory}/${fileEditorState.currentFile.name}`;
    fileEditorHtml = /* html */ `
      <div id="editor" class="editor">
        <form id="file-editor-form" class="editor" action="/admin/files/${filePath}" method="post" enctype="multipart/form-data">
          <textarea contenteditable ${
            fileEditorState.currentFile.fileType === 'binary' ? 'readonly' : 'form="file-editor-form"'
          }  class="editor" name="file-source" id="file-source" wrap="off">${he.escape(
            fileEditorState.currentFileContent,
          )}</textarea>
        </form>
        <div class="bottom-bar">
          <div class="buttons">
            <input form="file-editor-form" type="file" id="file" name="file" />
            <button form="file-editor-form" type="submit">Upload</button>
            <a href="/admin/file-source/${filePath}" download>
              <button primary>Download</button>
            </a>
          </div>
          <content-pill accent>File Type: ${fileEditorState.currentFile.fileType}</content-pill>
        </div>
      </div>
    `;
  }

  return html`
    <style>
      :host {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
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
        height: 100%;
        gap: 1rem;
      }
      textarea {
        width: 100%;
        height: 100%;
        font-family: monospace;
        background-color: var(--background);
        color: var(--text);
      }
      .editor-container {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        flex-grow: 1;
      }
      ul {
        flex-grow: 1;
      }
      .editor {
        flex-grow: 10;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .bottom-bar {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .file-type {
        font-weight: bold;
        background-color: var(--accent);
        color: var(--background);
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
      }
    </style>
    <div class="file-path">/ ${homeLink} / ${pathLinks.join(' / ')}</div>
    <div class="editor-container">
      <ul id="file-tree">
        ${fileElements.join('\n')}
      </ul>
      ${fileEditorHtml}
    </div>
  `;
}
