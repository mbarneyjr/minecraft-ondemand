import { Resource } from 'sst';
import { Hono } from 'hono';
import { FC } from 'hono/jsx';
import { handle, LambdaContext, LambdaEvent } from 'hono/aws-lambda';
import { twi } from 'tw-to-css';
import { Favicon } from '#src/icons/favicon.js';
import { admin } from '#src/pages/admin.js';
import { HomePage } from '#src/pages/home-page.js';
import { whitelist } from '#src/pages/whitelist.js';
import { authMiddleware, installAuthRoutes } from './middleware/oidc.js';
import { notifications } from './pages/notifications.js';

export const app = new Hono();

app.use('*', (c, next) => {
  // @hono/oidc-auth uses the request url in the state
  // since requests go through a cloudfront proxy,
  // we need to correct this so the callback works
  const url = new URL(c.req.url);
  url.hostname = Resource.ConfigLink.rootDomainName;
  c.req.raw = new Request(url.href, c.req.raw);
  return next();
});

app.use('*', authMiddleware);
installAuthRoutes(app);
app.get('/favicon.ico', async (c) => {
  const favicon = await c.render(<Favicon style={twi('text-green-500')} />);
  favicon.headers.set('Content-Type', 'image/svg+xml');
  return favicon;
});
app.get('/', async (c) => {
  return c.html(<HomePage c={c} />);
});

app.route('/admin', admin);
app.route('/notifications', notifications);
app.route('/whitelist', whitelist);

export const honoHandler = handle(app);
export async function handler(event: LambdaEvent, context: LambdaContext) {
  console.log('Event', JSON.stringify(event));
  const response = await honoHandler(event, context);
  console.log('Response', JSON.stringify(response));
  return response;
}
