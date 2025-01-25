import qs from 'querystring';
import { createFactory } from 'hono/factory';
import { Email } from '@minecraft-ondemand/core/email';
import { Whitelist } from '@minecraft-ondemand/core/whitelist';
import { WhitelistRequestEmail } from '#src/components/email/whitelist-request.js';
import { protectedMiddleware } from '#src/middleware/oidc.js';

const factory = createFactory();

export const whitelist = factory.createApp();

whitelist.post('/', async (c) => {
  const body = await c.req.formData();
  const username = body.get('username');
  if (typeof username !== 'string' || !username) {
    return c.redirect('/?error=invalid-username#join');
  }
  const email = await c.render(<WhitelistRequestEmail username={username} />);
  const content = (await email.text()).replace(/class=/g, 'style=');
  const adminEmails = await Email.listAdminEmails();
  if (!adminEmails.length) {
    return c.redirect('/?error=no-admin-emails#join');
  }
  await Email.sendEmail({
    destinations: adminEmails,
    subject: 'Whitelist Request',
    body: content,
  });
  return c.redirect('/?success=request-sent#join');
});

whitelist.get('/approve', protectedMiddleware, async (c) => {
  const username = c.req.query('username');
  if (!username) return c.redirect(`/?${qs.stringify({ error: 'no username specified' })}`);
  try {
    await Whitelist.addUser('vanilla', username);
    return c.redirect(`/admin?${qs.stringify({ success: 'user whitelisted' })}`);
  } catch (err) {
    console.log(err);
    return c.redirect(`/admin?${qs.stringify({ error: `${err}` })}`);
  }
});

whitelist.post('/users/:userName', protectedMiddleware, async (c) => {
  const { userName } = c.req.param();
  const { method } = c.req.query();
  if (method?.toLowerCase() === 'delete') {
    try {
      await Whitelist.removeUser('vanilla', userName);
      return c.redirect(`/admin?${qs.stringify({ success: 'user removed' })}`);
    } catch (err) {
      console.log(err);
      return c.redirect(`/admin?${qs.stringify({ error: `${err}` })}`);
    }
  } else {
    return c.redirect(`/admin?${qs.stringify({ error: 'invalid method on /users/:userName' })}`);
  }
});
