import { Session } from '../../session/index.mjs';

export interface LoggedInSession extends Session {
  refreshToken: string;
  accessToken: string;
  idToken: string;
}
