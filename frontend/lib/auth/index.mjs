import fetch from 'node-fetch';

import { config } from '../config/index.mjs';
import { logger } from '../logger/index.mjs';

/**
 * @typedef {object} TokenCodeResponse
 * @property {string} access_token
 * @property {string} id_token
 * @property {string} refresh_token
 * @property {string} token_type
 * @property {number} expires_in
 * @property {string} [error]
 */

/**
 * @typedef {Omit<TokenCodeResponse, 'refresh_token'>} RefreshedTokenCodeResponse
 */

/**
 * @param {import('aws-lambda').APIGatewayProxyEventV2} event
 * @param {string} authCode
 * @returns {Promise<TokenCodeResponse>}
 */
export async function getTokens(event, authCode) {
  const tokenParams = {
    client_id: config.auth.clientId,
    scope: config.auth.scope,
    redirect_uri: `${config.appEndpoint}/oauth2/idresponse`,
    grant_type: 'authorization_code',
    code: authCode,
  };
  logger.debug('getting tokens', { tokenParams });
  const response = await fetch(`${config.auth.baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(tokenParams),
  });
  const body = /** @type {import('./index.mjs').TokenCodeResponse} */ (await response.json());
  if (response.status < 200 || 299 < response.status) {
    throw new Error(`failed to fetch tokens: ${body.error}`);
  }
  return body;
}

/**
 * @param {string} refreshToken
 * @returns {Promise<RefreshedTokenCodeResponse>}
 */
export async function refreshTokens(refreshToken) {
  const refreshTokenParams = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.auth.clientId,
    scope: config.auth.scope,
  };
  logger.debug('refreshing tokens', { refreshTokenParams });
  const response = await fetch(`${config.auth.baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(refreshTokenParams),
  });
  const body = /** @type {import('./index.mjs').RefreshedTokenCodeResponse} */ (await response.json());
  if (response.status < 200 || 299 < response.status) {
    throw new Error(`failed to fetch tokens, ${body.error}`);
  }
  return body;
}
