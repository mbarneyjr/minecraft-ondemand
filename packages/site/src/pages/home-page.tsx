import { Layout } from '#src/components/layout.js';
import { FC } from 'hono/jsx';
import { ServerIcon } from '#src/icons/server.js';
import { RefreshIcon } from '#src/icons/refresh.js';
import { StopwatchIcon } from '#src/icons/stopwatch.js';
import { BlocksIcon } from '#src/icons/blocks.js';
import { SwordsIcon } from '#src/icons/swords.js';
import { ShieldIcon } from '#src/icons/shield.js';
import { Resource } from 'sst';

const Hero: FC = (props) => {
  return (
    <section className="mx-auto flex min-h-64 flex-col items-center justify-center bg-gradient-to-b from-green-600 to-green-400 text-center text-white">
      <h1 className="font-green-100 py-8 text-4xl font-bold">
        Welcome to <span className="text-yellow-300">{Resource.Config.rootDomainName}</span>
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

const Join: FC = (props) => {
  return (
    <section
      id="join"
      className="mx-auto flex max-w-screen-lg flex-col items-center justify-center gap-4 py-8 text-center"
    >
      <h2 className="text-4xl font-bold text-green-800">Join the Server!</h2>
      <p className="text-xl font-medium text-green-700">
        Add <span className="font-mono text-green-400">{Resource.Config.rootDomainName}</span> in your server list.
      </p>
    </section>
  );
};

export const HomePage: FC = (props) => {
  return (
    <Layout>
      <Hero />
      <HowItWorks />
      <ServerDetails />
      <Join />
    </Layout>
  );
};
