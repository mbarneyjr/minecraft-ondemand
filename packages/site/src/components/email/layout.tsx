import { FC, PropsWithChildren } from 'hono/jsx';
import { css, cx, keyframes, Style } from 'hono/css';
import { twi } from 'tw-to-css';
import { config } from '#src/lib/config.js';

export const EmailLayout: FC<PropsWithChildren<{ subject: string }>> = (props) => {
  return (
    <html>
      <head>
        <Style>{css`
          * {
            margin: 0;
          }
          a {
            text-decoration: unset;
            color: inherit;
          }
        `}</Style>
      </head>
      <body className={twi('wh-screen mx-auto max-w-screen-md flex-col justify-between shadow-2xl')}>
        <header>
          <div className={twi('bg-green-800 p-4 text-center shadow-lg')}>
            <span className={twi('text-xl text-green-300')}>Minecraft On-Demand</span>
            <br />
            <span className={twi('text-2xl font-bold text-green-100')}>{props.subject}</span>
          </div>
        </header>
        <div className={twi('bg-green-200 p-4 text-green-700')}>{props.children}</div>
        <footer>
          <div className={twi('bg-green-800 p-4 text-center text-lg text-green-100 shadow-lg')}>
            See more at{' '}
            <a className={twi('text-yellow-300')} href={`https://${config.rootDomainName}`}>
              {config.rootDomainName}
            </a>
            .
          </div>
        </footer>
      </body>
    </html>
  );
};