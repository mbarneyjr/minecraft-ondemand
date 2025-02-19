import { config, configLink } from './config';
import { zone, region } from './data';
import { vpc } from './vpc';
import { rootAccessPoint } from './efs';
import { Assets } from './lib/components/assets';
import { ipv6Proxy } from './ipv6-proxy';
import { vanillaServiceLink } from './service';
import { oidcLink } from './auth';
import { email, emailTable } from './email';

export const mountPathLink = new sst.Linkable('MountPathLink', {
  properties: {
    path: '/mnt/efs',
  },
});
export const siteFunction = new sst.aws.Function('SiteFunction', {
  handler: 'packages/site/src/app.handler',
  url: true,
  dev: false, // sst live lambda does not support ipv6 due to AppSync Events
  link: [
    // links
    configLink,
    email,
    emailTable,
    ipv6Proxy,
    oidcLink,
    mountPathLink,
    vanillaServiceLink,
  ],
  copyFiles: [
    {
      from: 'packages/site/src/public',
      to: 'public',
    },
  ],
  volume: {
    efs: rootAccessPoint.arn,
    path: mountPathLink.properties.path,
  },
  permissions: [
    {
      actions: ['ecs:DescribeServices', 'ecs:UpdateService', 'ecs:RunTask', 'iam:PassRole'],
      resources: ['*'],
    },
    {
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DescribeSubnets',
        'ec2:DeleteNetworkInterface',
        'ec2:AssignPrivateIpAddresses',
        'ec2:UnassignPrivateIpAddresses',
      ],
      resources: ['*'],
    },
  ],
  transform: {
    function: {
      vpcConfig: {
        ipv6AllowedForDualStack: true,
        securityGroupIds: vpc.securityGroups,
        subnetIds: vpc.privateSubnets,
      },
    },
  },
});

export const siteStaticAssets = new sst.aws.Bucket('SiteStaticAssets', {
  access: 'cloudfront',
  transform: {
    bucket: {
      bucket: `${$app.name}-${$app.stage}-site-static-assets`,
    },
  },
});
const uploadedAssets = Assets(siteStaticAssets.name, 'packages/site/src/public', 'public');
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
