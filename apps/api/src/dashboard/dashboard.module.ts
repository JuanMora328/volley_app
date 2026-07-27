import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { PlayerEntity } from '../database/entities';
import { Repository } from 'typeorm';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(@InjectRepository(PlayerEntity) private readonly players: Repository<PlayerEntity>) {}
  @Get()
  async getDashboard() {
    return {
      activeSession: null,
      stats: {
        activePlayers: await this.players.countBy({ active: true }),
        completedSessions: 0,
        pendingPayments: 0,
        registeredMatches: 0,
      },
      recentSessions: [],
    };
  }
}

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PlayerEntity])],
  controllers: [DashboardController],
})
export class DashboardModule {}
