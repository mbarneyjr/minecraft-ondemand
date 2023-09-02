import { APIGatewayProxyEventV2 } from '@types/aws-lambda';
import { Session } from '../session/index.d.ts';

export interface StateBase extends Record<string, unknown> {
  head: {
    title?: string
    description?: string
  }
}

export interface RenderResult {
  body?: string
  state?: StateBase
  session: Session
  headers?: Record<string, string>
  isBase64Decoded?: boolean
  statusCode?: number
}

export type RenderFunction = (event: APIGatewayProxyEventV2, session: Session) => Promise<RenderResult>

export interface Route {
  params: Record<string, string>
  handler: RenderFunction
}

export function addRoute(method: string, path: string, handler: RenderFunction): void
export function getRoute(method: string, path: string): Route | null
export function routerHandler(event: APIGatewayProxyEventV2, session: Session): Promise<RenderResult>
