declare module 'node-webtokens' {
  interface JwtPayload extends Record<string, unknown> {
    iss: string
    sub: string
    aud: string
    exp: number
    value: string
  }
  type ParsedWebtoken = {
    parts: string[]
    type: string
    payload?: JwtPayload
    error?: string
    setTokenLifetime(lifetime: number): ParsedWebtoken
    verify(key: string): void
  }
  function parse(token: string): ParsedWebtoken
  function generate(algorithm: string, encoding: string, payload: Record<string, unknown>, key: string): string
}
