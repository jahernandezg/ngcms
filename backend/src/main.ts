/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpErrorFilter } from './common/filters/http-exception.filter';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { httpLog, appLogger } from './common/logging/winston.logger';

// Diagnóstico de fallos silenciosos
process.on('unhandledRejection', (reason: unknown) => {
  appLogger.error({ msg: 'unhandled_rejection', reason });
});
process.on('uncaughtException', (err: Error) => {
  appLogger.error({ msg: 'uncaught_exception', error: err.message, stack: err.stack });
});

interface ReqWithId extends Request { requestId?: string }

function requestContextMiddleware(req: ReqWithId, _res: Response, next: () => void) {
  req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
  next();
}
function requestLoggerMiddleware(req: ReqWithId, res: Response, next: () => void) {
  const start = Date.now();
  res.setHeader('x-request-id', req.requestId || '');
  res.on('finish', () => {
    const duration = Date.now() - start;
    const info = { method: req.method, url: req.originalUrl, status: res.statusCode, ms: duration, requestId: req.requestId };
    httpLog(info);
    if (res.statusCode >= 500) {
      // Promover visibilidad de 5xx a error.log
      appLogger.error({ msg: 'http_error', ...info });
    } else if (res.statusCode >= 400) {
      appLogger.warn({ msg: 'http_error', ...info });
    }
  });
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Puede afinarse; desactivado para SSR/angular dev
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
  app.use(compression());
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  app.use(requestContextMiddleware, requestLoggerMiddleware);
  // Static uploads
  const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    appLogger.warn({ msg: 'mkdir_uploads_failed', error: (e as Error)?.message });
  }
  app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', index: false }));
  // Redirects 301 de rutas legacy a rutas cortas SEO
  app.use((req: Request, res: Response, next: () => void) => {
    // Patrones legacy: /api/posts/category/:slug -> /api/category/:slug
    const legacyCategory = /^\/api\/posts\/category\/(.+)$/;
    const legacyTag = /^\/api\/posts\/tag\/(.+)$/;
    const legacyAuthor = /^\/api\/posts\/author\/(.+)$/; // antes id; mantenemos redirección por compatibilidad
    const legacySearch = /^\/api\/search\/posts(.*)$/; // mover a /api/search
    const url = req.url;
    let target: string | null = null;
    const m1 = url.match(legacyCategory);
    if (m1) target = `/api/category/${m1[1]}` + (req.url.includes('?') ? '' : '');
    const m2 = url.match(legacyTag);
    if (!target && m2) target = `/api/tag/${m2[1]}`;
    const m3 = url.match(legacyAuthor);
    if (!target && m3) target = `/api/author/${m3[1]}`;
    const m4 = url.match(legacySearch);
    if (!target && m4) {
      // m4[1] incluye query ya capturada (p.e. ?q=...) si existe
      target = `/api/search${m4[1]}`;
    }
    if (target) {
      return res.redirect(301, target);
    }
    next();
  });
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  let document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  // Post-procesar para envolver todas las respuestas 2xx en el envelope { success, message, data }
  const wrapSuccessResponses = (doc: OpenAPIObject): OpenAPIObject => {
    const successCodes = /^2\d\d$/;
    for (const pathKey of Object.keys(doc.paths || {})) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pathItem = (doc.paths as Record<string, any>)[pathKey];
      if (!pathItem) continue;
      for (const method of Object.keys(pathItem)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const op = (pathItem as Record<string, any>)[method];
        if (!op || !op.responses) continue;
        for (const code of Object.keys(op.responses)) {
          if (!successCodes.test(code)) continue;
          const resp = op.responses[code];
          if (!resp?.content?.['application/json']?.schema) continue;
          const originalSchema = resp.content['application/json'].schema;
          // Evitar doble envoltura si ya contiene success & data
          if (originalSchema?.properties?.success && originalSchema?.properties?.data) continue;
          resp.content['application/json'].schema = {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'OK' },
              data: originalSchema
            },
            required: ['success', 'data']
          };
        }
      }
    }
    // Definir esquema de error genérico (referencia informativa)
    doc.components = doc.components || {};
    doc.components.schemas = doc.components.schemas || {};
    if (!doc.components.schemas.ErrorResponse) {
      doc.components.schemas.ErrorResponse = {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Not Found' },
          statusCode: { type: 'integer', example: 404 },
          path: { type: 'string', example: '/api/posts/x' },
          timestamp: { type: 'string', format: 'date-time' }
        },
        required: ['success', 'message', 'statusCode', 'path', 'timestamp']
      };
    }
    return doc;
  };
  document = wrapSuccessResponses(document);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  const appUrl = await app.getUrl();
  appLogger.info({ msg: 'app_started', url: `${appUrl}/${globalPrefix}` });
  setInterval(() => appLogger.info({ msg: 'keep_alive' }), 30000).unref();
}

bootstrap();
export { bootstrap };
