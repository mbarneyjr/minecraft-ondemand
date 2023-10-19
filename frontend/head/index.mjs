/* eslint-disable-next-line no-unused-vars */
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
      <script src="https://mbarney.me/public/components/nav-bar/index.mjs" defer></script>
    </head>
  `;
}
