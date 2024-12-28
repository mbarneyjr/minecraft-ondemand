import { Resource } from 'sst';
import { Hono } from 'hono';
import { FC } from 'hono/jsx';
import { handle } from 'hono/aws-lambda';
import { oidcAuthMiddleware, revokeSession, processOAuthCallback } from '@hono/oidc-auth';
import { twi } from 'tw-to-css';
import { Favicon } from '#src/icons/favicon.js';
import { AdminPage } from '#src/pages/admin.js';
import { HomePage } from '#src/pages/home-page.js';
import { whitelist } from '#src/pages/whitelist.js';

export const app = new Hono();

app.use('*', (c, next) => {
  // @hono/oidc-auth uses the request url in the state
  // since requests go through a cloudfront proxy,
  // we need to correct this so the callback works
  const url = new URL(c.req.url);
  url.hostname = Resource.Config.rootDomainName;
  c.req.raw = new Request(url.href, c.req.raw);
  return next();
});

// oidc setup
app.get('/logout', async (c) => {
  await revokeSession(c);
  return c.redirect('/');
});
app.get('/login', oidcAuthMiddleware(), async (c) => {
  return c.redirect('/');
});
app.get('/oauth2/idresponse', async (c) => {
  return processOAuthCallback(c);
  return c.text('ok');
});

app.get('/favicon.ico', async (c) => {
  const favicon = await c.render(<Favicon style={twi('text-green-500')} />);
  favicon.headers.set('Content-Type', 'image/svg+xml');
  return favicon;
});

app.get('/', async (c) => {
  return c.html(<HomePage c={c} />);
});

app.get('/admin', oidcAuthMiddleware(), async (c) => {
  return c.html(<AdminPage c={c} />);
});

app.route('/whitelist', whitelist);

export const handler = handle(app);
