import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Level = 'debug' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private platformId = inject(PLATFORM_ID);
  private level: Level = ((): Level => {
    if (typeof window === 'undefined') return 'info';
  const v = (window as unknown as Record<string, unknown>)['__LOG_LEVEL__'];
    return (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') ? v : 'info';
  })();
  private isTest = typeof (globalThis as Record<string, unknown>)['JEST_WORKER_ID'] !== 'undefined';

  private should(logLevel: Level) {
    if (this.isTest) return false; // silencia en tests
    const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
    return order[logLevel] >= order[this.level];
  }
  debug(...args: unknown[]) { if (this.should('debug')) console.warn('[DEBUG]', ...args); }
  info(...args: unknown[]) { if (this.should('info')) console.warn('[INFO]', ...args); }
  warn(...args: unknown[]) { if (this.should('warn')) console.warn(...args); }
  error(...args: unknown[]) { if (this.should('error')) console.error(...args); }
  setLevel(l: Level) { this.level = l; }
  isBrowser() { return isPlatformBrowser(this.platformId); }
}
