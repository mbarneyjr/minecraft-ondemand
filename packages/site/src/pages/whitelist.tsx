import { createFactory } from 'hono/factory';
import { Email } from '@minecraft-ondemand/core/email';
import { WhitelistRequestEmail } from '#src/components/email/whitelist-request.js';

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
    return c.redirect('/error=no-admin-emails#join');
  }
  await Email.sendEmail({
    destinations: adminEmails,
    subject: 'Whitelist Request',
    body: content,
  });
  return c.redirect('/?success=request-sent#join');
});
