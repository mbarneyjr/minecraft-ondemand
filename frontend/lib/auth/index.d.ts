import { APIGatewayProxyEventV2 } from '@types/aws-lambda';

export interface TokenCodeResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  error?: string
}

export type RefreshedTokenCodeResponse = Omit<TokenCodeResponse, 'refresh_token'>;

export async function getTokens(event: APIGatewayProxyEventV2, authCode: string): Promise<TokenCodeResponse>;
export async function refreshTokens(refreshToken: string): Promise<RefreshedTokenCodeResponse>;
