import qs from 'querystring';
import { Users } from '@minecraft-ondemand/core/users';
import { Toolbox } from '@minecraft-ondemand/intui/toolbox';

const toolbox = new Toolbox();

toolbox.addTool({
  type: 'form',
  id: 'create-admin-user',
  name: 'Create Admin User',
  description: 'creates a new administrator user',
  fields: [
    {
      name: 'email',
      description: 'new admin email address',
      type: 'string',
      required: true,
    },
  ],
  handler: async (c) => {
    const data = await c.req.formData();
    const email = data.get('email');
    if (!email) {
      console.error('Missing email');
      return c.redirect(`/?${qs.stringify({ error: 'could not create admin user, missing email' })}`);
    }
    console.log('Creating admin user with email:', email);
    try {
      await Users.createAdminUser(email.toString());
    } catch (err) {
      console.error('Error creating user:', err);
      return c.redirect(`/?${qs.stringify({ error: `Error creating user: ${err}` })}`);
    }
    return c.redirect(`/?${qs.stringify({ success: 'admin user created' })}`);
  },
});

toolbox.start();
