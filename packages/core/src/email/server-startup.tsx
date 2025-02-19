import { Resource } from 'sst';
import { FC } from 'hono/jsx';
import { css, cx, keyframes, Style } from 'hono/css';
import { twi } from 'tw-to-css';
import { EmailLayout } from './layout.js';
import { Email } from '#src/email.mjs';

const subject = 'Server Startup';

export const ServerStartupEmail: FC<{ domainName: string }> = (props) => {
  return (
    <EmailLayout
      subject={subject}
      unsubscribeUrl={`https://${Resource.ConfigLink.rootDomainName}/notifications/{{email}}?unsubscribe`}
    >
      <div className={twi('p-4 text-lg text-green-700')}>
        <p>The server is now live!</p>
        <p>Connect to the server using the following address:</p>
      </div>
      <div className={twi('p-4 font-mono text-2xl')}>
        <p
          className={twi('bg-green-100 p-4 text-center text-green-600')}
          dangerouslySetInnerHTML={{
            __html: props.domainName.split('.').join('<span>.</span>'),
          }}
        />
      </div>
    </EmailLayout>
  );
};

export async function sendServerStartupEmail(destinations: Array<string>, domainName: string) {
  if (!destinations.length) return;

  const email = (<ServerStartupEmail domainName={domainName} />).toString();
  const body = email.replace(/class=/g, 'style=');
  await Email.sendTemplatedEmail({
    destinations,
    subject,
    body,
  });
}
