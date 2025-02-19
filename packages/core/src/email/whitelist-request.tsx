import { Resource } from 'sst';
import { FC } from 'hono/jsx';
import { css, cx, keyframes, Style } from 'hono/css';
import { twi } from 'tw-to-css';
import { EmailLayout } from './layout.js';
import { Email } from '#src/email.mjs';

export const WhitelistRequestEmail: FC<{ username: string }> = (props) => {
  return (
    <EmailLayout subject="Whitelist Request">
      <div className={twi('p-4 text-lg text-green-700')}>
        <p>The following user has requested to be whitelisted.</p>
      </div>
      <div className={twi('p-4 font-mono text-2xl')}>
        <p className={twi('bg-green-100 p-4 text-center text-green-600')}>{props.username}</p>
      </div>
      <div className={twi('flex w-full gap-4')} style="gap: 1rem">
        <a
          href={`https://${Resource.ConfigLink.rootDomainName}/whitelist/approve?username=${props.username}`}
          className={twi('m-4 w-full rounded-lg bg-green-600 p-4 text-center text-lg text-white')}
        >
          Approve
        </a>
      </div>
    </EmailLayout>
  );
};

export async function sendWhitelistRequestEmail(destinations: Array<string>, username: string) {
  if (!destinations.length) return;
  const email = (<WhitelistRequestEmail username={username} />).toString();
  const body = email.replace(/class=/g, 'style=');

  await Email.sendEmail({
    destinations,
    subject: 'Whitelist Request',
    body,
  });
}
