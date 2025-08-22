export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];

  if (!config.DATABASE_URL) errors.push('DATABASE_URL is required');

  if (config.PORT && isNaN(Number(config.PORT))) errors.push('PORT must be a number');

  if (errors.length) {
    throw new Error(`Invalid environment configuration: ${errors.join('; ')}`);
  }

  return {
    ...config,
    PORT: config.PORT ? Number(config.PORT) : 3000,
    NODE_ENV: config.NODE_ENV || 'development',
    SITE_URL: config.SITE_URL || 'http://localhost:4000',
  };
}
