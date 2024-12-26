import { fileURLToPath } from 'url';
import { Hono } from 'hono';
import type { FC } from 'hono/jsx';
import { handle } from 'hono/aws-lambda';
import { HomePage } from './pages/home-page.js';
import { Favicon } from './icons/favicon.js';

export const app = new Hono();

app.get('/', (c) => {
  return c.html(<HomePage />);
});

app.get('/favicon.ico', async (c) => {
  const favicon = await c.render(<Favicon className="text-green-500" />);
  favicon.headers.set('Content-Type', 'image/svg+xml');
  return favicon;
});

export const handler = handle(app);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fs = await import('fs');
  const { join } = await import('path');
  const url = await import('url');
  const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
  app.use(
    (await import('hono/serve-static')).serveStatic({
      root: join(__dirname, 'public'),
      rewriteRequestPath: (path) => path.replace(/^\/public/, ''),
      getContent: async (path) => {
        console.log('GET static assets', path);
        try {
          return fs.readFileSync(path, 'utf-8');
        } catch (e) {
          return null;
        }
      },
    }),
  );
  (await import('@hono/node-server')).serve(app, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
