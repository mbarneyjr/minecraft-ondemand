import { config } from './config';
import { zone } from './data';
import { Assets } from './lib/components/assets';
import { randomUUID } from 'crypto';

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

const configLink = new sst.Linkable('Config', {
  properties: {
    rootDomainName: config.rootDomainName,
  },
});

const password = new random.RandomPassword('OidcSecret', {
  length: 32,
});

export const siteFunction = new sst.aws.Function('SiteFunction', {
  handler: 'packages/site/src/app.handler',
  url: true,
  link: [configLink, email, table],
  environment: {
    OIDC_ISSUER: $interpolate`https://cognito-idp.${region.name}.amazonaws.com/${userPool.id}`,
    OIDC_AUTH_SECRET: password.result,
    OIDC_CLIENT_ID: appClient.id,
    OIDC_SCOPES: 'openid',
    OIDC_CLIENT_SECRET: appClient.clientSecret,
    OIDC_REDIRECT_URI: appClient.callbackUrls[0],
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

new sst.x.DevCommand('SiteDev', {
  dev: {
    directory: 'packages/site',
    command: 'npm run dev',
  },
  link: [configLink],
});
