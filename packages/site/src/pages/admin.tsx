import { FC, PropsWithChildren } from 'hono/jsx';
import { Context } from 'hono';
import { createFactory } from 'hono/factory';
import { Whitelist } from '@minecraft-ondemand/core/whitelist';
import { Layout } from '#src/components/layout.js';
import { DeleteIcon } from '#src/icons/delete.js';
import { getAuth, protectedMiddleware } from '#src/middleware/oidc.js';

const factory = createFactory();

export const admin = factory.createApp();

admin.get('/', protectedMiddleware, async (c) => {
  const auth = c.get('auth');
  const users = Whitelist.listUsers('vanilla');
  return c.html(
    <Layout c={c}>
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 p-4">
        <div className="flex flex-col justify-between sm:flex-row">
          <h1 className="text-center text-2xl">Admin Page</h1>
          <p className="text-center font-mono text-lg">{auth.email}</p>
        </div>
        <div className="sahdow-lg flex flex-col gap-4 rounded-lg bg-green-100 p-6 shadow-lg">
          <h2 className="text-xl">Whitelist:</h2>
          <form action="/whitelist/approve" method="get" className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              name="username"
              placeholder="Minecraft username"
              className="flex-grow rounded-lg border-2 border-green-300 p-4"
            />
            <button type="submit" className="rounded-lg bg-green-800 p-4 font-bold text-white">
              Whitelist User
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
        <div className="flex flex-col gap-4 rounded-lg bg-green-100 p-6 shadow-lg">
          <h2 className="text-xl">Admin Auth Debug Info:</h2>
          <pre className="max-w-full overflow-auto bg-green-50 p-4">{JSON.stringify(auth, null, 2)}</pre>
        </div>
      </div>
    </Layout>,
  );
});
