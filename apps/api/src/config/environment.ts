export function validateEnvironment(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const databaseUrl = String(config.DATABASE_URL ?? '');
  const jwtSecret = String(config.JWT_SECRET ?? '');

  if (!databaseUrl) throw new Error('DATABASE_URL es obligatorio.');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 caracteres.');
  }
  if (nodeEnv === 'production' && !String(config.CORS_ORIGIN ?? '').trim()) {
    throw new Error('CORS_ORIGIN es obligatorio en producción.');
  }

  return config;
}
