import { Resource } from 'sst';
import { FC, PropsWithChildren } from 'hono/jsx';
import { css, cx, keyframes, Style } from 'hono/css';
import { twi } from 'tw-to-css';

export const EmailLayout: FC<PropsWithChildren<{ subject: string; unsubscribeUrl?: string }>> = (props) => {
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
        <div className={twi('p-4 bg-green-50')}>{props.children}</div>
        <footer className={twi('bg-green-800 p-4 text-center text-lg text-green-100 shadow-lg')}>
          <p>
            See more at{' '}
            <a className={twi('text-yellow-300 underline')} href={`https://${Resource.Config.rootDomainName}`}>
              {Resource.Config.rootDomainName}
            </a>
            .
          </p>
          {props.unsubscribeUrl && (
            <p className={twi('bg-green-800 text-center text-sm text-green-100')}>
              <a href={props.unsubscribeUrl} className={twi('text-yellow-300 text-sm underline')}>
                Unsubscribe
              </a>{' '}
              to stop receiving emails.
            </p>
          )}
        </footer>
      </body>
    </html>
  );
};
