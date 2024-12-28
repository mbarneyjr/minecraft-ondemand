import { Layout } from '#src/components/layout.js';
import { FC, PropsWithChildren } from 'hono/jsx';
import { Context } from 'hono';
import { getAuth } from '@hono/oidc-auth';

export const AdminPage: FC<PropsWithChildren<{ c: Context }>> = async (props) => {
  const auth = await getAuth(props.c);
  return (
    <Layout c={props.c}>
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 p-4">
        <h1 className="text-center text-2xl">Admin Page</h1>
        <div className="sahdow-lg rounded-lg bg-green-100 p-6">
          <h2 className="p-4 text-xl">Auth:</h2>
          <pre className="max-w-full overflow-auto bg-green-50 p-4">{JSON.stringify(auth, null, 2)}</pre>
        </div>
      </div>
    </Layout>
  );
};
