import 'reflect-metadata';
import { join } from 'node:path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { entities } from './entities';

config({ path: join(__dirname, '../../../../.env') });
config({ path: join(__dirname, '../../.env'), override: true });
config();

const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL o MIGRATION_DATABASE_URL es requerido para TypeORM.');
}

function resolveSslOption(url: string, sslEnv?: string, rejectUnauthorizedEnv?: string) {
  if (sslEnv === 'true') {
    return { rejectUnauthorized: rejectUnauthorizedEnv !== 'false' };
  }

  if (sslEnv === 'false') {
    return false;
  }

  return /[?&]sslmode=/.test(url) ? undefined : false;
}

const ssl = resolveSslOption(
  databaseUrl,
  process.env.DATABASE_SSL,
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
);

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
  migrationsTableName: 'typeorm_migrations',
  logging: process.env.NODE_ENV === 'development',
  ...(ssl === undefined ? {} : { ssl }),
  extra: {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    application_name: 'volleyflow_typeorm_migrations',
  },
});
