import { config } from './config';
import { zone } from './data';

export const emailTable = new sst.aws.Dynamo('EmailTable', {
  fields: {
    pk: 'string',
    sk: 'string',
  },
  primaryIndex: {
    hashKey: 'pk',
    rangeKey: 'sk',
  },
});
export const email = new sst.aws.Email('Email', {
  sender: config.rootDomainName,
  dmarc: 'v=DMARC1; p=quarantine; adkim=s; aspf=s;',
  dns: sst.aws.dns({
    zone: zone.id,
  }),
});
