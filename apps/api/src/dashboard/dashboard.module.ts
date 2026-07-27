import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
class DashboardController {
  @Get()
  getDashboard() {
    return {
      activeSession: null,
      stats: {
        activePlayers: 0,
        completedSessions: 0,
        pendingPayments: 0,
        registeredMatches: 0,
      },
      recentSessions: [],
    };
  }
}

@Module({ imports: [AuthModule], controllers: [DashboardController] })
export class DashboardModule {}
