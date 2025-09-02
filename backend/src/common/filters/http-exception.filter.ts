import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { appLogger } from '../logging/winston.logger';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Internal server error';
    const errorResponse = {
      success: false,
      message,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    } as const;
    // Log structured error
    const payload: Record<string, unknown> = {
      msg: 'http_error',
      method: request.method,
      status,
      url: request.url,
    };
    if (exception instanceof HttpException) {
      const resp = exception.getResponse() as unknown;
      if (typeof resp === 'string') {
        payload['error'] = resp;
      } else if (resp && typeof resp === 'object' && 'message' in (resp as Record<string, unknown>)) {
        const m = (resp as Record<string, unknown>)['message'];
        payload['error'] = Array.isArray(m) ? m.join(', ') : (m as string) || exception.message;
      } else {
        payload['error'] = exception.message;
      }
    } else if (exception instanceof Error) {
      payload['error'] = exception.message;
      payload['stack'] = exception.stack;
    } else {
      payload['error'] = String(exception);
    }
    appLogger.error(payload);
    response.status(status).json(errorResponse);
  }
}
