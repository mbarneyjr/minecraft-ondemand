import { config } from './config';

const gotHostedZone = await aws.route53.getZone({ name: config.hostedZoneName });
export const zone = aws.route53.Zone.get('HostedZone', gotHostedZone.id);
