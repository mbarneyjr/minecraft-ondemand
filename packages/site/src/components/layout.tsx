import { FC } from 'hono/jsx';
import { css, cx, keyframes, Style } from 'hono/css';
import { Resource } from 'sst';

export const Layout: FC = (props) => {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>{Resource.Config.rootDomainName}</title>
        <meta
          name="description"
          content={`This is the landing page for ${Resource.Config.rootDomainName}, my on-demand Minecraft server.`}
        />
        <link rel="icon" type="image/svg" href="/favicon.ico" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="flex h-screen flex-col justify-between">
        <header className="z-50 bg-green-800 font-mono font-bold text-green-100 shadow-lg">
          <Style>{css`
            nav-bar::part(toggle) {
              padding: 1rem;
            }
            nav-bar::part(toggle-line) {
              background-color: white;
            }
          `}</Style>
          <script src="/public/components/nav-bar.mjs" type="module"></script>
          <nav-bar breakpoint="768px" className="mx-auto max-w-screen-lg">
            <a className="p-4 text-lg hover:bg-green-700" href="/" slot="left">
              {Resource.Config.rootDomainName}
            </a>
            <a className="p-4 text-lg hover:bg-green-700" href="#how-it-works" slot="right">
              How It Works
            </a>
            <a className="p-4 text-lg hover:bg-green-700" href="#server-details" slot="right">
              Server Details
            </a>
            <a className="p-4 text-lg hover:bg-green-700" href="#join" slot="right">
              Join
            </a>
          </nav-bar>
        </header>

        <main class="z-30 flex-grow shadow-2xl">{props.children}</main>

        <footer className="z-10 bg-green-800 py-6 text-center font-semibold text-green-100">
          <div className="mx-auto max-w-screen-lg">
            Check out some other cool things at{' '}
            <a className="text-yellow-300 hover:underline" href="https://barney.dev">
              barney.dev
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
};
