import { Resource } from 'sst';
import { z } from 'zod';
import { Context, Hono, MiddlewareHandler } from 'hono';
import { sign, verify } from 'hono/jwt';
import { JWTPayload, JwtTokenExpired } from 'hono/utils/jwt/types';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { createMiddleware } from 'hono/factory';
import * as oauth from 'oauth4webapi';

type OidcResources = {
  authorizationServer: oauth.AuthorizationServer;
  client: oauth.Client;
  clientAuth: oauth.ClientAuth;
};
type OidcConfig = {
  issuer: URL;
  authSecret: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  redirectUri: string;
  cookieName: string;
  sessionDuration: number;
};

const sessionSchema = z.object({
  exp: z.number(),
  iat: z.number(),
  email: z.string(),
  sub: z.string(),
  /** refresh token */
  rtk: z.string(),
});
export type Session = z.infer<typeof sessionSchema>;

/**
 * get the current time in seconds
 */
function now() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get a session from cookies, refreshing if expired.
 */
async function getSession(context: Context, config: OidcConfig, oidcResources: OidcResources) {
  const sessionToken = getCookie(context, config.cookieName);
  if (sessionToken === undefined) {
    return null;
  }
  let tokenPayload: JWTPayload;
  try {
    tokenPayload = await verify(sessionToken, config.authSecret);
  } catch (err) {
    if (err instanceof JwtTokenExpired) return null;
    throw err;
  }
  const sessionTokenParseResult = sessionSchema.safeParse(tokenPayload);
  if (!sessionTokenParseResult.success) {
    deleteCookie(context, config.cookieName);
    return null;
  }
  const sessionTokenPayload = sessionTokenParseResult.data;
  if (sessionTokenPayload.exp < now()) {
    deleteCookie(context, config.cookieName);
    const refreshTokenGrantResponse = await oauth.refreshTokenGrantRequest(
      oidcResources.authorizationServer,
      oidcResources.client,
      oidcResources.clientAuth,
      sessionTokenPayload.rtk,
    );
    try {
      const idTokenResult = await oauth.processRefreshTokenResponse(
        oidcResources.authorizationServer,
        oidcResources.client,
        refreshTokenGrantResponse,
      );
      await updateSession(context, idTokenResult, config, sessionTokenPayload);
    } catch (err) {
      if (err instanceof oauth.ResponseBodyError) return null;
      throw err;
    }
  }
  return sessionTokenPayload;
}

/**
 * Creates a new session cookie with the given id token.
 */
async function updateSession(
  context: Context<{ Variables: { auth: Session } }>,
  idTokenResult: oauth.TokenEndpointResponse,
  config: OidcConfig,
  originalSession?: Session,
) {
  const claims = oauth.getValidatedIdTokenClaims(idTokenResult)!;
  const sessionParseResult = sessionSchema.safeParse({
    ...claims,
    exp: now() + config.sessionDuration,
    rtk: idTokenResult.refresh_token ?? originalSession?.rtk,
  });
  if (!sessionParseResult.success) {
    throw new HTTPException(500, { message: 'Invalid id token claims' });
  }
  const newSessionToken = await sign(sessionParseResult.data, config.authSecret);
  setCookie(context, config.cookieName, newSessionToken, { httpOnly: true, secure: true });
  context.set('auth', sessionParseResult.data);
}

/**
 * Delete the session cookie
 */
async function revokeSession(context: Context, config: OidcConfig) {
  deleteCookie(context, config.cookieName);
}

async function getAuthorizationRequestUrl(context: Context, config: OidcConfig, oidcResources: OidcResources) {
  const path = new URL(config.redirectUri).pathname;
  const state = oauth.generateRandomState();
  const nonce = oauth.generateRandomNonce();
  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  if (!oidcResources.authorizationServer.authorization_endpoint) {
    throw new HTTPException(500, { message: 'Authorization endpoint not found' });
  }
  const authorizationRequestUrl = new URL(oidcResources.authorizationServer.authorization_endpoint);
  authorizationRequestUrl.searchParams.set('client_id', config.clientId);
  authorizationRequestUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizationRequestUrl.searchParams.set('response_type', 'code');
  authorizationRequestUrl.searchParams.set('scope', config.scopes);
  authorizationRequestUrl.searchParams.set('state', state);
  authorizationRequestUrl.searchParams.set('nonce', nonce);
  authorizationRequestUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationRequestUrl.searchParams.set('code_challenge_method', 'S256');
  setCookie(context, 'state', state, { path, httpOnly: true, secure: true });
  setCookie(context, 'nonce', nonce, { path, httpOnly: true, secure: true });
  setCookie(context, 'code_verifier', codeVerifier, { path, httpOnly: true, secure: true });
  setCookie(context, 'continue', context.req.url, { path, httpOnly: true, secure: true });
  return authorizationRequestUrl.toString();
}

async function processCallback(context: Context, config: OidcConfig, oidcResources: OidcResources) {
  const path = new URL(config.redirectUri).pathname;
  // get and delete cookies
  const state = getCookie(context, 'state');
  deleteCookie(context, 'state', { path });
  const nonce = getCookie(context, 'nonce');
  deleteCookie(context, 'nonce', { path });
  const codeVerifier = getCookie(context, 'code_verifier');
  deleteCookie(context, 'code_verifier', { path });
  const continueUrl = getCookie(context, 'continue');
  deleteCookie(context, 'continue', { path });
  // exchange code for token
  const currentUrl = new URL(context.req.url);
  const codeResponseParams = oauth.validateAuthResponse(
    oidcResources.authorizationServer,
    oidcResources.client,
    currentUrl,
    state,
  );
  const authorizationCodeGrantResponse = await oauth.authorizationCodeGrantRequest(
    oidcResources.authorizationServer,
    oidcResources.client,
    oidcResources.clientAuth,
    codeResponseParams,
    config.redirectUri,
    codeVerifier ?? '',
  );
  const idTokenResult = await oauth.processAuthorizationCodeResponse(
    oidcResources.authorizationServer,
    oidcResources.client,
    authorizationCodeGrantResponse,
    {
      expectedNonce: nonce,
      requireIdToken: true,
    },
  );
  await updateSession(context, idTokenResult, config, undefined);
  return context.redirect(continueUrl ?? '/');
}

export async function oidcAuthMiddleware(config: OidcConfig) {
  const oidcResources: OidcResources = {
    authorizationServer: await oauth.processDiscoveryResponse(
      config.issuer,
      await oauth.discoveryRequest(config.issuer),
    ),
    client: { client_id: config.clientId },
    clientAuth: oauth.ClientSecretPost(config.clientSecret),
  };

  /** Middleware to add authentication information to routes */
  const authMiddleware = createMiddleware<{ Variables: { auth?: Session } }>(async (context, next) => {
    const session = await getSession(context, config, oidcResources);
    if (session !== null) context.set('auth', session);
    return next();
  });

  /** Middleware that requires a valid session to continue */
  const protectedMiddleware = createMiddleware<{ Variables: { auth: Session } }>(async (context, next) => {
    const session = await getSession(context, config, oidcResources);
    if (session === null) {
      // if no session or invalid session, redirect user to login
      const authorizationUrl = await getAuthorizationRequestUrl(context, config, oidcResources);
      return context.redirect(authorizationUrl);
    }
    context.set('auth', session);
    return next();
  });

  const installAuthRoutes = (app: Hono) => {
    app.get('/oauth2/idresponse', async (c) => {
      return processCallback(c, config, oidcResources);
    });
    app.get('/logout', async (c) => {
      await revokeSession(c, config);
      return c.redirect('/');
    });
  };

  const getAuth = (context: Context) => {
    return getSession(context, config, oidcResources);
  };

  return {
    authMiddleware,
    protectedMiddleware,
    installAuthRoutes,
    getAuth,
  };
}

export const { authMiddleware, protectedMiddleware, installAuthRoutes, getAuth } = await oidcAuthMiddleware({
  issuer: new URL(Resource.OidcLink.issuer),
  authSecret: Resource.OidcLink.authSecret,
  clientId: Resource.OidcLink.clientId,
  clientSecret: Resource.OidcLink.clientSecret,
  scopes: Resource.OidcLink.scopes,
  redirectUri: Resource.OidcLink.redirectUri,
  cookieName: 'auth',
  sessionDuration: 60 * 60 * 24 * 30,
});
