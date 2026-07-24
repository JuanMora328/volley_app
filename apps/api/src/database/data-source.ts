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

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
  migrationsTableName: 'typeorm_migrations',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  extra: {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    application_name: 'volleyflow_typeorm_migrations',
  },
});
