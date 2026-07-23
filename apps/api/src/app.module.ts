import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { entities } from './database/entities';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { VenuesModule } from './venues/venues.module';
import { SessionsModule } from './sessions/sessions.module';
import { DashboardModule } from './dashboard/dashboard.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        url: c.getOrThrow('DATABASE_URL'),
        entities,
        synchronize: false,
        migrationsRun: false,
        migrationsTableName: 'typeorm_migrations',
        logging: c.get('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
        ssl:
          c.get('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: c.get('DATABASE_SSL_REJECT_UNAUTHORIZED') !== 'false' }
            : false,
        extra: {
          max: Number(c.get('DATABASE_POOL_MAX') ?? 5),
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 10000,
        },
        retryAttempts: 5,
        retryDelay: 2000,
      }),
    }),
    HealthModule,
    AuthModule,
    PlayersModule,
    VenuesModule,
    SessionsModule,
    DashboardModule,
  ],
})
export class AppModule {}
