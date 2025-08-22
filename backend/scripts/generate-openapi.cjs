const { NestFactory } = require('@nestjs/core');
require('reflect-metadata');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', emitDecoratorMetadata: true, experimentalDecorators: true } });
// Configure path aliases similar to tsconfig paths
try {
  const moduleAlias = require('module-alias');
  const path = require('path');
  const root = path.resolve(__dirname, '../../');
  moduleAlias.addAliases({
    '@cms-workspace/utils': path.join(root, 'libs/utils/src/index.ts'),
    '@cms-workspace/shared-types': path.join(root, 'libs/shared-types/src/index.ts'),
    '@cms-workspace/database': path.join(root, 'libs/src/index.ts')
  });
} catch (e) {
  // ignore if module-alias not installed
}
const path = require('path');
let AppModule;
try {
  const appModulePath = path.join(__dirname, '../src/app/app.module.ts');
  AppModule = require(appModulePath).AppModule;
  if (!AppModule) throw new Error('AppModule export no encontrado en ' + appModulePath);
} catch (err) {
  console.error('Error cargando AppModule:', err);
  process.exit(1);
}
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const { writeFileSync } = require('fs');

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  let document = SwaggerModule.createDocument(app, config);

  const wrapSuccessResponses = (doc) => {
    const successCodes = /^2\d\d$/;
    for (const pathKey of Object.keys(doc.paths || {})) {
      const pathItem = doc.paths?.[pathKey] || {};
      for (const method of Object.keys(pathItem)) {
        const op = pathItem[method];
        if (!op || !op.responses) continue;
        for (const code of Object.keys(op.responses)) {
          if (!successCodes.test(code)) continue;
          const resp = op.responses[code];
          if (!resp?.content?.['application/json']?.schema) continue;
          const originalSchema = resp.content['application/json'].schema;
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
