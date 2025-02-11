import { config } from './config';
import { zone } from './data';
import { vpc } from './vpc';
import { efs } from './efs';
import { Assets } from './lib/components/assets';
import { ipv6Proxy } from './ipv6-proxy';

const region = await aws.getRegion();

export const siteStaticAssets = new sst.aws.Bucket('SiteStaticAssets', {
  access: 'cloudfront',
  transform: {
    bucket: {
      bucket: `${$app.name}-${$app.stage}-site-static-assets`,
    },
  },
});

const uploadedAssets = Assets(siteStaticAssets.name, 'packages/site/src/public', 'public');

export const userPool = new aws.cognito.UserPool('UserPool', {
  name: $interpolate`${$app.name}-${$app.stage}-user-pool`,
  usernameAttributes: ['email'],
  autoVerifiedAttributes: ['email'],
  schemas: [
    {
      name: 'email',
      mutable: true,
      required: true,
      attributeDataType: 'String',
    },
  ],
  mfaConfiguration: 'OPTIONAL',
  softwareTokenMfaConfiguration: {
    enabled: true,
  },
  adminCreateUserConfig: {
    allowAdminCreateUserOnly: true,
  },
});

const userPoolLink = new sst.Linkable('UserPoolLink', {
  properties: {
    userPoolId: userPool.id,
  },
});

export const userPoolDomain = new aws.cognito.UserPoolDomain('UserPoolDomain', {
  userPoolId: userPool.id,
  domain: $interpolate`${$app.name}-${$app.stage}`,
});

export const appClient = new aws.cognito.UserPoolClient('AppClient', {
  name: $interpolate`${$app.name}-${$app.stage}-app-client`,
  userPoolId: userPool.id,
  callbackUrls: [$interpolate`https://${config.rootDomainName}/oauth2/idresponse`],
  supportedIdentityProviders: ['COGNITO'],
  allowedOauthFlowsUserPoolClient: true,
  allowedOauthFlows: ['code'],
  allowedOauthScopes: ['openid'],
  generateSecret: true,
});

const appClientLink = new sst.Linkable('AppClientLink', {
  properties: {
    clientId: appClient.id,
  },
});

export const table = new sst.aws.Dynamo('EmailTable', {
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

export const configLink = new sst.Linkable('Config', {
  properties: {
    rootDomainName: config.rootDomainName,
  },
});

const password = new random.RandomPassword('OidcSecret', {
  length: 32,
});

export const oidcLink = new sst.Linkable('Oidc', {
  properties: {
    issuer: $interpolate`https://cognito-idp.${region.name}.amazonaws.com/${userPool.id}`,
    authSecret: password.result,
    clientId: appClient.id,
    clientSecret: appClient.clientSecret,
    scopes: 'openid',
    redirectUri: appClient.callbackUrls[0],
  },
});

export const mountPathLink = new sst.Linkable('MountPath', {
  properties: {
    path: '/mnt/efs',
  },
});

export const siteFunction = new sst.aws.Function('SiteFunction', {
  handler: 'packages/site/src/app.handler',
  url: true,
  dev: false, // sst live lambda does not support ipv6 due to AppSync Events
  link: [configLink, email, table, ipv6Proxy, oidcLink, mountPathLink],
  copyFiles: [
    {
      from: 'packages/site/src/public',
      to: 'public',
    },
  ],
  volume: {
    efs,
    path: mountPathLink.properties.path,
  },
  environment: {
    OIDC_ISSUER: $interpolate`https://cognito-idp.${region.name}.amazonaws.com/${userPool.id}`,
    OIDC_AUTH_SECRET: password.result,
    OIDC_CLIENT_ID: appClient.id,
    OIDC_SCOPES: 'openid',
    OIDC_CLIENT_SECRET: appClient.clientSecret,
    OIDC_REDIRECT_URI: appClient.callbackUrls[0],
  },
  permissions: [
    {
      actions: ['ecs:DescribeServices', 'ecs:UpdateService'],
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
