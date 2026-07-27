import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GameSessionEntity, MatchEntity, TeamEntity, TeamPlayerEntity } from '../database/entities';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([GameSessionEntity, MatchEntity, TeamEntity, TeamPlayerEntity]),
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
