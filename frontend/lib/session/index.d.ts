export type Session = Record<string, string | null>;

export async function parseSession(cookies: Array<string> | undefined): Promise<Session>;
export async function writeSession(session: Session): Promise<Array<string>>;
