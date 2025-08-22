import { format, transports, createLogger } from 'winston';

export const appLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({})
  ],
});

export function httpLog(info: { method: string; url: string; status: number; ms: number; requestId?: string }) {
  appLogger.info({ msg: 'http_request', ...info });
}
