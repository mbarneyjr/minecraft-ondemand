import { FC, PropsWithChildren } from 'hono/jsx';
import { Context } from 'hono';
import { createFactory } from 'hono/factory';
import { Whitelist } from '@minecraft-ondemand/core/whitelist';
import { Service } from '@minecraft-ondemand/core/service';
import { Mapsync } from '@minecraft-ondemand/core/mapsync';
import { Layout } from '#src/components/layout.js';
import { DeleteIcon } from '#src/icons/delete.js';
import { getAuth, protectedMiddleware } from '#src/middleware/oidc.js';
import { Resource } from 'sst';

const factory = createFactory();

export const admin = factory.createApp();

admin.post('/server-status', protectedMiddleware, async (c) => {
  const body = await c.req.formData();
  if (body.has('start')) {
    await Service.startService();
    let status = await Service.getStatus();
    while (status === 'stopped') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await Service.getStatus();
    }
  }
  if (body.has('stop')) {
    await Service.stopService();
    let status = await Service.getStatus();
    while (status === 'running') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await Service.getStatus();
    }
  }
  return c.redirect('/admin');
});

admin.post('/mapsync', protectedMiddleware, async (c) => {
  const body = await c.req.formData();
  await Mapsync.startMapsync();
  return c.redirect('/admin');
});

admin.get('/', protectedMiddleware, async (c) => {
  const auth = c.get('auth');
  const users = Whitelist.listUsers('vanilla');
  const serviceStatus = await Service.getStatus();
  const now = new Date();
  return c.html(
    <Layout c={c}>
      <div className="mx-auto flex max-w-screen-2xl flex-col justify-between px-6 pt-4 sm:flex-row">
        <h1 className="text-center text-2xl">Admin Page</h1>
        <p className="text-center font-mono text-lg">{auth.email}</p>
      </div>
      <div className="mx-auto flex max-w-screen-2xl flex-col flex-wrap gap-4 p-4 sm:flex-row">
        <div className="flex flex-auto flex-col gap-4 rounded-lg bg-green-100 p-6 shadow-lg">
          <h2 className="text-xl">Server Controls:</h2>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-lg">
              Status: <span className="font-mono font-semibold">{serviceStatus}</span>
            </p>
            <p className="text-center text-lg">
              Refreshed: {now.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}
            </p>
          </div>
          <form action="/admin/server-status" method="post" className="flex flex-col gap-4 sm:flex-row">
            <button
              type="submit"
              className="min-w-fit flex-grow rounded-lg bg-green-800 p-4 font-bold text-white"
              name="start"
              value="start"
            >
              Start
            </button>
            <button
              type="submit"
              className="min-w-fit flex-grow rounded-lg bg-red-800 p-4 font-bold text-white"
              name="stop"
              value="stop"
            >
              Stop
            </button>
          </form>
        </div>
        <div className="flex flex-auto flex-col gap-4 rounded-lg bg-green-100 p-6 shadow-lg">
          <h2 className="text-xl">Whitelist:</h2>
          <form action="/whitelist/approve" method="get" className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="flex-grow rounded-lg border-2 border-green-300 p-4"
            />
            <button type="submit" className="min-w-fit rounded-lg bg-green-800 p-4 font-bold text-white">
              Add User
            </button>
          </form>
          <ul className="flex flex-col rounded-lg">
            {users.map((user) => (
              <li className="flex items-center justify-between p-4 align-baseline odd:bg-green-50 even:bg-white hover:bg-green-100">
                <p className="font-mono">{user.name}</p>
                <form className="contents" action={`/whitelist/users/${user.name}?method=DELETE`} method="post">
                  <button type="submit">
                    <DeleteIcon className="inline h-6 w-6 text-red-800" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-auto flex-col gap-4 rounded-lg bg-green-100 p-6 shadow-lg">
          <h2 className="text-xl">Map Sync:</h2>
          <form action="/admin/mapsync" method="post" className="flex flex-col gap-4 sm:flex-row">
            <button type="submit" className="min-w-fit rounded-lg bg-green-800 p-4 font-bold text-white">
              Update Map
            </button>
          </form>
        </div>
        {'debug' in c.req.query() ? (
          <div className="flex flex-auto flex-col gap-4 rounded-lg bg-green-100 p-6 shadow-lg">
            <h2 className="text-xl">Admin Auth Debug Info:</h2>
            <pre className="max-w-full overflow-auto bg-green-50 p-4">{JSON.stringify(auth, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </Layout>,
  );
});
