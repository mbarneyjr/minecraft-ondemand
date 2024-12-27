import { FC } from 'hono/jsx';
import { css, cx, keyframes, Style } from 'hono/css';
import { twi } from 'tw-to-css';
import { config } from '#src/lib/config.js';
import { EmailLayout } from './layout.js';

export const WhitelistRequestEmail: FC<{ username: string }> = (props) => {
  return (
    <EmailLayout subject="Whitelist Request">
      <div className={twi('p-4 text-lg')}>
        <p>The following user has requested to be whitelisted.</p>
      </div>
      <div className={twi('p-4 font-mono text-2xl')}>
        <p className={twi('bg-green-100 p-4 text-center')}>{props.username}</p>
      </div>
      {/* TODO: add support for approving/rejecting requests through email */}
      {/* <div className={twi('flex w-full gap-4')} style="gap: 1rem"> */}
      {/*   <a */}
      {/*     href={`https://${config.rootDomainName}/whitelist/approve?username=${props.username}`} */}
      {/*     className={twi('m-4 w-full rounded-2xl bg-green-600 p-4 text-center text-lg text-white')} */}
      {/*   > */}
      {/*     Approve */}
      {/*   </a> */}
      {/*   <a */}
      {/*     href={`https://${config.rootDomainName}/whitelist/reject?username=${props.username}`} */}
      {/*     className={twi('m-4 w-full rounded-2xl bg-red-600 p-4 text-center text-lg text-white')} */}
      {/*   > */}
      {/*     Reject */}
      {/*   </a> */}
      {/* </div> */}
    </EmailLayout>
  );
};
