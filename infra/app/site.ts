import { config } from './config';
import { zone } from './data';
import { Assets } from './lib/components/assets';

export const siteStaticAssets = new sst.aws.Bucket('SiteStaticAssets', {
  access: 'cloudfront',
  transform: {
    bucket: {
      bucket: `${$app.name}-${$app.stage}-site-static-assets`,
    },
  },
});

const uploadedAssets = Assets(siteStaticAssets.name, 'packages/site/src/public', 'public');

const configLink = new sst.Linkable('Config', {
  properties: {
    rootDomainName: config.rootDomainName,
  },
});

const table = new sst.aws.Dynamo('EmailTable', {
  fields: {
    pk: 'string',
    sk: 'string',
  },
  primaryIndex: {
    hashKey: 'pk',
    rangeKey: 'sk',
  },
});

const email = new sst.aws.Email('Email', {
  sender: config.rootDomainName,
  dns: sst.aws.dns({
    zone: zone.id,
  }),
});

export const siteFunction = new sst.aws.Function('SiteFunction', {
  handler: 'packages/site/src/app.handler',
  url: true,
  link: [configLink, email, table],
});

export const router = new sst.aws.Router('SiteRouter', {
  domain: {
    name: config.rootDomainName,
    dns: sst.aws.dns({
      zone: zone.id,
    }),
  },
  invalidation: true,
  routes: {
    '/public/*': {
      bucket: siteStaticAssets,
    },
    '/*': siteFunction.url,
  },
});

new sst.x.DevCommand('SiteDev', {
  dev: {
    directory: 'packages/site',
    command: 'npm run dev',
  },
  link: [configLink],
});
