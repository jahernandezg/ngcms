import 'dotenv/config';
// Config vacío intencional: solo asegura que dotenv cargue .env antes de que Prisma lea schema.
export default {};

// Prisma optional config (CommonJS)
/*module.exports = {
  schema: './prisma/schema.prisma',
  seed: 'ts-node --transpile-only prisma/seed.ts'
};*/