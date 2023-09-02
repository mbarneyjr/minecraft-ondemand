import { ApiGatewayProxyEventV2 } from '@types/aws-lambda';
import { StateBase } from '../lib/router/index.d.ts';

export function Head(event: ApiGatewayProxyEventV2, state: StateBase): string;
