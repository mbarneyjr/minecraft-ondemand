import { Session } from '../../session/index.d.ts';
import { RenderFunction, RenderResult } from '../../router/index.d.ts';

export interface LoggedInSession extends Session {
  refreshToken: string
  accessToken: string
  idToken: string
}

export type AuthenticatedRenderFunction = RenderFunction extends (event: ApiGatewayProxyEventV2, session: Session) => RenderResult ? (event: ApiGatewayProxyEventV2, session: LoggedInSession) => RenderResult : never;

export function isLoggedIn(session: Session): session is LoggedInSession;
export function sessionNeedsRefresh(session: LoggedInSession): boolean;
export function refreshSession(session: LoggedInSession): Promise<LoggedInSession>;
export function redirectToLogin(session: Session, requestedPath: string): RenderResult;

export type AuthMiddleWare = (renderer: AuthenticatedRenderFunction) => RenderFunction;
