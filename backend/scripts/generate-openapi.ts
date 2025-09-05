import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  let document: OpenAPIObject = SwaggerModule.createDocument(app, config);

  type JsonSchema = Record<string, unknown>;
  const wrapSuccessResponses = (doc: OpenAPIObject): OpenAPIObject => {
    const successCodes = /^2\d\d$/;
    for (const pathKey of Object.keys(doc.paths || {})) {
      const pathItem = (doc.paths?.[pathKey] ?? {}) as Record<string, unknown>;
      if (!pathItem) continue;
      for (const method of Object.keys(pathItem)) {
        const op = pathItem[method as keyof typeof pathItem] as { responses?: Record<string, { content?: Record<string, { schema?: JsonSchema }> }> } | undefined;
        if (!op || !op.responses) continue;
        for (const code of Object.keys(op.responses)) {
          if (!successCodes.test(code)) continue;
            const resp = op.responses[code];
            if (!resp?.content?.['application/json']?.schema) continue;
            const originalSchema = resp.content['application/json'].schema as JsonSchema & { properties?: Record<string, unknown> };
            if ((originalSchema as { properties?: { success?: unknown; data?: unknown } }).properties?.success && (originalSchema as { properties?: { success?: unknown; data?: unknown } }).properties?.data) continue;
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
  writeFileSync('swagger.json', JSON.stringify(document, null, 2));
  await app.close();
  console.error('OpenAPI spec generada en swagger.json');
}

generate().catch(e => {
  console.error(e);
  process.exit(1);
});
