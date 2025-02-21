import { config } from './config';
import { region } from './data';

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
const password = new random.RandomPassword('OidcSecret', {
  length: 32,
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
  tokenValidityUnits: {
    refreshToken: 'days',
  },
  refreshTokenValidity: 30,
});
export const oidcLink = new sst.Linkable('OidcLink', {
  properties: {
    issuer: $interpolate`https://cognito-idp.${region.name}.amazonaws.com/${userPool.id}`,
    authSecret: password.result,
    clientId: appClient.id,
    clientSecret: appClient.clientSecret,
    scopes: 'openid',
    redirectUri: appClient.callbackUrls[0],
  },
});
