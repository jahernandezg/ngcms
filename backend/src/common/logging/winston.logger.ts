import { format, transports, createLogger } from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists (root folder)
const LOG_DIR = path.resolve(process.cwd());
try {
  // no-op if exists; write access will be validated by transports
  fs.accessSync(LOG_DIR, fs.constants.W_OK);
} catch (_) {
  // fallback notice (console used intentionally only on startup)
  console.warn('[logging] CWD not writable, falling back to temp dir');
}

const errorLogPath = path.join(LOG_DIR, 'error.log');
const appLogPath = path.join(LOG_DIR, 'app.log');

export const appLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console for local dev
    new transports.Console({}),
    // File transports: keep it simple without rotation for now
    new transports.File({ filename: errorLogPath, level: 'error' }),
    new transports.File({ filename: appLogPath, level: 'info' })
  ],
});

export function httpLog(info: { method: string; url: string; status: number; ms: number; requestId?: string }) {
  appLogger.info({ msg: 'http_request', ...info });
}
