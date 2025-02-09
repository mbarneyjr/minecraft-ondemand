import { Resource } from 'sst';
import { Email } from '@minecraft-ondemand/core/email';
import { sendServerStartupEmail } from '@minecraft-ondemand/core/email/server-startup';

type Event = {
  detail: {
    serviceId: string;
    domainName: string;
    publicIp: string;
    edition: string;
  };
};

export async function lambdaHandler(event: Event) {
  console.log(`event: ${JSON.stringify(event)}`);
  const userEmails = await Email.listUserEmails();
  await sendServerStartupEmail(userEmails, event.detail.domainName);
}
