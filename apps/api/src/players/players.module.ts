import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PlayerEntity } from '../database/entities';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity]), AuthModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
