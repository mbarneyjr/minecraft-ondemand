/* eslint-disable-next-line no-unused-vars */

import { readFileSync } from 'fs';

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @param {import('../lib/router/index.types.mjs').State | undefined} state
 * @returns {string}
 */
export default function Head(event, state) {
  const title = state?.head?.title ? `${state.head.title} - mc.mbarney.me` : 'mc.mbarney.me';
  const description = state?.head?.description ?? '';
  const devHtml =
    process.env.LOCAL === 'true'
      ? /* html */ `
      <script>
        document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
      </script>`
      : '';
  const importMap = readFileSync('./importmap.json');

  return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="${description}">
      <title>${title}</title>
      <link rel="icon" href="/static/favicon.ico">
      <link rel="stylesheet" href="/static/globals.css">
      ${devHtml}
      <link rel="stylesheet" href="https://unpkg.com/@mbarneyjr/webcomponents@2.2.0/src/styles/index.css" />
      <script
        async
        src="https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js"
        crossorigin="anonymous"
      ></script>
      <script type="importmap">${importMap}</script>
      <script type="module" src="/static/index.mjs" blocking="render" async></script>
      <script>
        // this is necessary to force the browser to evaluate this before render, to prevent flashing
        const prefersColorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const currentSystemScheme = prefersColorSchemeMediaQuery.matches ? 'dark' : 'light';
        const currentColorScheme =
          /** @type {'dark' | 'light'} */ (localStorage.getItem('color-scheme')) || currentSystemScheme;
        document.documentElement.setAttribute('data-theme', currentColorScheme);
      </script>
    </html>
  `;
}
