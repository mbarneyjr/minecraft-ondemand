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

export const siteFunction = new sst.aws.Function('SiteFunction', {
  dev: false,
  handler: 'packages/site/src/app.handler',
  url: true,
  link: [configLink],
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
