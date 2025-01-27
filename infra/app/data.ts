import { config } from './config';

export const region = await aws.getRegion();
export const identity = await aws.getCallerIdentity();

const gotHostedZone = await aws.route53.getZone({ name: config.hostedZoneName });
export const zone = aws.route53.Zone.get('HostedZone', gotHostedZone.id);
