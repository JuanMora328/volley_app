import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  GameSessionEntity,
  PlayerEntity,
  SessionPlayerEntity,
  TeamEntity,
  TeamPlayerEntity,
  VenueEntity,
} from '../database/entities';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      GameSessionEntity,
      PlayerEntity,
      SessionPlayerEntity,
      TeamEntity,
      TeamPlayerEntity,
      VenueEntity,
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
