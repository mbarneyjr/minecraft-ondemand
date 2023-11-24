import he from 'he';
import { config } from '../lib/config/index.mjs';
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
    const link =
      fileEditorState.currentDirectory === ''
        ? `/admin/files/${f.name}`
        : `/admin/files/${fileEditorState.currentDirectory}/${f.name}`;

    return /* html */ `
      <li>
        <a href="${link}">${f.fileType === 'directory' ? `${f.name}/` : f.name}</a>
      </li>
    `;
  });

  const filePath = `${fileEditorState.currentDirectory}/${fileEditorState.currentFile.name}`;
  let fileEditorHtml = '';
  if (fileEditorState.currentFile) {
    if (fileEditorState.currentFile.fileType === 'text') {
      fileEditorHtml = /* html */ `
        <form id="file-editor-form" class="editor" action="/admin/files/${filePath}" method="post">
          <textarea form="file-editor-form" class="editor" name="file" id="file" cols="35" wrap="soft">${fileEditorState.currentFileContent}</textarea>
          <button type="submit">Save</button>
        </form>
      `;
    } else if (fileEditorState.currentFile.fileType === 'binary') {
      fileEditorHtml = /* html */ `
        <div class="download-upload-buttons">
          <a href="/admin/file-source/${filePath}" download>
            <button primary>Download ${fileEditorState.currentFile.name}</button>
          </a>
        </div>
      `;
    }
  }

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
      .download-upload-buttons {
        flex-shrink: 1;
      }
    </style>
    <h1>/ ${homeLink} / ${pathLinks.join(' / ')}</h1>
    <div class="container">
      <ul>
        ${fileElements.join('\n')}
      </ul>
      ${fileEditorHtml}
    </div>
  `;
}
