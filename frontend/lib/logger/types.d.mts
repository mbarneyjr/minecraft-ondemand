export interface RequestContext {
  method: string | null
  path: string | null
}

export interface LogContext {
  request: RequestContext
}

export type LogData = Record<string, unknown>

export interface Log extends LogContext {
  message: string
  data?: LogData
}
