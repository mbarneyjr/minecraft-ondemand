export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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

export function getLogLevel(input: string | undefined): number

export function log(level: LogLevel, message: string, data?: LogData, requestContext?: RequestContext): Log

export type LoggerFunction = (message: string, data?: LogData, requestContext?: RequestContext) => Log;

export const logger: Record<LogLevel, LoggerFunction>;

export function errorJson (err: unknown): Record<string, unknown>;
