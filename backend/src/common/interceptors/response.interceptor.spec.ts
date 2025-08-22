import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function createExecutionContext(url: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ url }) }),
  } as unknown as ExecutionContext;
}

describe('ResponseInterceptor', () => {
  it('wraps plain object', (done) => {
    const interceptor = new ResponseInterceptor();
    const ctx = createExecutionContext('/api/test');
    const next: CallHandler = { handle: () => of({ a: 1 }) };
    interceptor.intercept(ctx, next).subscribe((res) => {
      expect(res).toEqual({ success: true, message: 'OK', data: { a: 1 } });
      done();
    });
  });

  it('passes through already wrapped', (done) => {
    const interceptor = new ResponseInterceptor();
    const ctx = createExecutionContext('/api/test');
    const payload = { success: true, message: 'OK', data: { a: 1 } };
    const next: CallHandler = { handle: () => of(payload) };
    interceptor.intercept(ctx, next).subscribe((res) => {
      expect(res).toBe(payload);
      done();
    });
  });

  it('bypasses sitemap.xml', (done) => {
    const interceptor = new ResponseInterceptor();
    const ctx = createExecutionContext('/sitemap.xml');
    const next: CallHandler = { handle: () => of('raw-xml') };
    interceptor.intercept(ctx, next).subscribe((res) => {
      expect(res).toBe('raw-xml');
      done();
    });
  });

  it('normalizes paged results', (done) => {
    const interceptor = new ResponseInterceptor();
    const ctx = createExecutionContext('/api/posts');
    const next: CallHandler = { handle: () => of({ items: [1,2], total: 2, page: 1, limit: 10 }) };
    interceptor.intercept(ctx, next).subscribe((res) => {
      expect(res).toEqual({ success: true, message: 'OK', data: [1,2], meta: { total: 2, page: 1, limit: 10, totalPages: 1 } });
      done();
    });
  });
});
