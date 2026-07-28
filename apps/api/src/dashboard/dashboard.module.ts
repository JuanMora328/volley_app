import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { GameSessionEntity, PlayerEntity, SessionPlayerEntity } from '../database/entities';
import { In, Repository } from 'typeorm';
import { GameSessionStatus } from '@volleyflow/shared';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    @InjectRepository(PlayerEntity) private readonly players: Repository<PlayerEntity>,
    @InjectRepository(GameSessionEntity) private readonly sessions: Repository<GameSessionEntity>,
    @InjectRepository(SessionPlayerEntity)
    private readonly sessionPlayers: Repository<SessionPlayerEntity>,
  ) {}
  @Get()
  async getDashboard() {
    const [activeSession, recentSessions, completedSessions] = await Promise.all([
      this.sessions.findOne({
        where: { status: In([GameSessionStatus.DRAFT, GameSessionStatus.TEAMS_CREATED]) },
        order: { date: 'DESC' },
      }),
      this.sessions.find({ order: { date: 'DESC' }, take: 5 }),
      this.sessions.countBy({ status: GameSessionStatus.FINISHED }),
    ]);
    const activeParticipantCount = activeSession
      ? await this.sessionPlayers.count({ where: { session: { id: activeSession.id } } })
      : 0;
    return {
      activeSession: activeSession
        ? {
            id: activeSession.id,
            title: activeSession.venueNameSnapshot,
            date: activeSession.date,
            venueName: activeSession.venueNameSnapshot,
            participantCount: activeParticipantCount,
            statusLabel: activeSession.status,
          }
        : null,
      stats: {
        activePlayers: await this.players.countBy({ active: true }),
        completedSessions,
        pendingPayments: 0,
        registeredMatches: 0,
      },
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        title: session.venueNameSnapshot,
        date: session.date,
        status: session.status,
      })),
    };
  }
}

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([PlayerEntity, GameSessionEntity, SessionPlayerEntity]),
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
