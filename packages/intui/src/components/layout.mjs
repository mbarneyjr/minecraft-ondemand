const html = String.raw;

/**
 * @param {object} props
 * @param {string} props.children
 * @param {import('hono').Context} props.c
 */
export const Layout = async (props) => {
  const { error, success } = props.c.req.query();
  const errorMessage = error ? html`<p class="w-full bg-red-500 p-4 text-center text-white">${error}</p>` : '';
  const successMessage = success ? html`<p class="w-full bg-green-500 p-4 text-center text-white">${success}</p>` : '';
  return html`
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>IntUI Toolbox</title>
        <link rel="icon" href="/favicon.svg" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="flex h-screen flex-col justify-between">
        <header class="bg-blue-800 p-4 font-mono font-bold text-blue-100">
          <h1 class="text-center text-2xl">IntUI Toolbox</h1>
        </header>
        <main class="z-30 flex-grow shadow-2xl">${errorMessage} ${successMessage} ${props.children}</main>
      </body>
    </html>
  `;
};
