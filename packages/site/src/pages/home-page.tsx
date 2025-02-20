import { Resource } from 'sst';
import { FC, PropsWithChildren } from 'hono/jsx';
import { Context } from 'hono';
import { Layout } from '#src/components/layout.js';
import { ServerIcon } from '#src/icons/server.js';
import { RefreshIcon } from '#src/icons/refresh.js';
import { StopwatchIcon } from '#src/icons/stopwatch.js';
import { BlocksIcon } from '#src/icons/blocks.js';
import { SwordsIcon } from '#src/icons/swords.js';
import { ShieldIcon } from '#src/icons/shield.js';
import { SuccessIcon } from '#src/icons/success.js';
import { ErrorIcon } from '#src/icons/error.js';

const Hero: FC = (props) => {
  return (
    <section className="mx-auto flex min-h-64 flex-col items-center justify-center bg-gradient-to-b from-green-600 to-green-400 text-center text-white">
      <h1 className="font-green-100 py-8 text-4xl font-bold">
        Welcome to <span className="text-yellow-300">{Resource.ConfigLink.rootDomainName}</span>
      </h1>
      <p className="py-8">My on-demand Minecraft server</p>
    </section>
  );
};

const HowItWorks: FC = (props) => {
  return (
    <section
      id="how-it-works"
      className="mx-auto flex max-w-screen-lg flex-col items-center justify-center gap-4 py-8 text-center"
    >
      <h2 className="text-4xl font-bold text-green-800">How It Works</h2>
      <ul className="flex flex-col gap-6 md:flex-row">
        <li className="flex-1 rounded-lg bg-green-100 p-6 shadow-lg">
          <ServerIcon className="mx-auto h-16 w-16 text-green-800" />
          <p className="text-xl font-medium text-green-700">On-Demand Server</p>
          <p className="text-green-600">The server starts offline to save resources.</p>
        </li>
        <li className="flex-1 rounded-lg bg-green-100 p-6 shadow-lg">
          <RefreshIcon className="mx-auto h-16 w-16 text-green-800" />
          <p className="text-xl font-medium text-green-700">Quick Boot</p>
          <p className="text-green-600">
            A connection attempt triggers the server to start. Refresh in a few minutes to join!
          </p>
        </li>
        <li className="flex-1 rounded-lg bg-green-100 p-6 shadow-lg">
          <StopwatchIcon className="mx-auto h-16 w-16 text-green-800" />
          <p className="text-xl font-medium text-green-700">Auto Shutdown</p>
          <p className="text-green-600">The server automatically shuts down after 20 minutes of no players online.</p>
        </li>
      </ul>
    </section>
  );
};

const ServerDetails: FC = (props) => {
  return (
    <section
      id="server-details"
      className="mx-auto flex max-w-screen-lg flex-col items-center justify-center gap-4 py-8 text-center"
    >
      <h2 className="text-4xl font-bold text-green-800">Server Details</h2>
      <ul className="flex flex-col gap-6 md:flex-row">
        <li className="flex-1 rounded-lg bg-green-100 p-6 shadow-lg">
          <BlocksIcon className="mx-auto h-16 w-16 text-green-800" />
          <p className="text-xl font-medium text-green-700">Vanilla Minecraft</p>
          <p className="text-green-600">Pure Minecraft experience with no mods and minimal plugins.</p>
        </li>
        <li className="flex-1 rounded-lg bg-green-100 p-6 shadow-lg">
          <SwordsIcon className="mx-auto h-16 w-16 text-green-800" />
          <p className="text-xl font-medium text-green-700">Survival Mode</p>
          <p className="text-green-600">
            This server is survival-only. No commands, cheats, or anything like that will be performed.
          </p>
        </li>
        <li className="flex-1 rounded-lg bg-green-100 p-6 shadow-lg">
          <ShieldIcon className="mx-auto h-16 w-16 text-green-800" />
          <p className="text-xl font-medium text-green-700">Hard Difficulty</p>
          <p className="text-green-600">This server is on hard difficulty only.</p>
        </li>
      </ul>
    </section>
  );
};

const Join: FC<PropsWithChildren<{ c: Context }>> = (props) => {
  const { error, success } = props.c.req.query();
  const icon =
    error !== undefined ? (
      <ErrorIcon className="inline h-6 w-6 text-red-800" />
    ) : (
      <SuccessIcon className="inline h-6 w-6 text-green-800" />
    );
  const messageStyles = error !== undefined ? 'text-red-800 bg-red-200' : 'text-green-800 bg-green-200';
  const message = {
    'invalid-username': 'Invalid username. Please try again.',
    'no-admin-emails': 'There are no administrators for this server to approve your request.',
    'request-sent': 'Your request has been sent!',
  }[(error || success) ?? ''];
  return (
    <section id="join" className="mx-auto max-w-screen-lg">
      <div className="flex flex-col justify-center gap-4 py-8 text-center">
        <h2 className="text-4xl font-bold text-green-800">Join the Server!</h2>
        <form action="/whitelist" method="post" className="w-100 flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            name="username"
            placeholder="Your Minecraft username"
            className="flex-grow rounded-lg border-2 border-green-300 p-4 shadow-lg"
          />
          <button type="submit" className="rounded-lg bg-green-800 p-4 font-bold text-white shadow-lg">
            Join the Server
          </button>
        </form>
        <p className="text-xl font-medium text-green-700">
          Your request will be reviewed. Add{' '}
          <span className="font-mono text-green-400">{Resource.ConfigLink.rootDomainName}</span> in your server list.
        </p>
        {message !== undefined ? (
          <div className={`${messageStyles} flex items-center justify-center gap-1 p-4`}>
            {icon}
            <p className={''}>{message}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export const HomePage: FC<PropsWithChildren<{ c: Context }>> = (props) => {
  return (
    <Layout c={props.c}>
      <Hero />
      <HowItWorks />
      <ServerDetails />
      <Join c={props.c} />
    </Layout>
  );
};
