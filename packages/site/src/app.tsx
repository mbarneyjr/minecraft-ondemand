import { Hono } from 'hono';
import { FC } from 'hono/jsx';
import { handle } from 'hono/aws-lambda';
import { Favicon } from '#src/icons/favicon.js';
import { HomePage } from '#src/pages/home-page.js';
import { whitelist } from '#src/pages/whitelist.js';

export const app = new Hono();

app.get('/', (c) => {
  return c.html(<HomePage c={c} />);
});

app.get('/favicon.ico', async (c) => {
  const favicon = await c.render(<Favicon className="text-green-500" />);
  favicon.headers.set('Content-Type', 'image/svg+xml');
  return favicon;
});

app.route('/whitelist', whitelist);

export const handler = handle(app);
