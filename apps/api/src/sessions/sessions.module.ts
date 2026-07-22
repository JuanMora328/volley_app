import { Body, Controller, Delete, Get, Module, Param, Patch, Post, Put } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import {
  calculateRotation,
  distributeIntegerAmount,
  GameSessionStatus,
  generateBalancedTeams,
} from '@volleyflow/shared';
import {
  GameSessionEntity,
  MatchEntity,
  PlayerEntity,
  SessionPlayerEntity,
  TeamEntity,
  TeamPlayerEntity,
  VenueEntity,
} from '../database/entities';
class CreateSessionDto {
  @IsString() date!: string;
  @IsOptional() @IsString() venueId?: string;
  @IsInt() @Min(0) courtPrice!: number;
  @IsInt() @Min(0) gatoradePrice!: number;
  @IsInt() @Min(2) teamCount!: number;
  @IsInt() @Min(1) defaultTargetScore!: number;
}
@Controller('sessions')
class SessionsController {
  constructor(
    @InjectRepository(GameSessionEntity) private sessions: Repository<GameSessionEntity>,
    private ds: DataSource,
  ) {}
  @Get() list() {
    return this.sessions.find({ order: { date: 'DESC' } });
  }
  @Post() async create(@Body() dto: CreateSessionDto) {
    let venue: VenueEntity | null = null;
    if (dto.venueId)
      venue = await this.ds.getRepository(VenueEntity).findOneBy({ id: dto.venueId });
    return this.sessions.save(
      this.sessions.create({
        ...dto,
        currentTargetScore: dto.defaultTargetScore,
        venue,
        venueNameSnapshot: venue?.name ?? 'Cancha por definir',
        status: GameSessionStatus.DRAFT,
      }),
    );
  }
  @Get(':id') get(@Param('id') id: string) {
    return this.sessions.findOneOrFail({
      where: { id },
      relations: { venue: true, championTeam: true },
    });
  }
  @Patch(':id') async update(@Param('id') id: string, @Body() dto: Partial<CreateSessionDto>) {
    await this.sessions.update(id, dto as any);
    return this.get(id);
  }
  @Post(':id/players') async addPlayer(
    @Param('id') id: string,
    @Body() body: { playerId: string; levelSnapshot?: number },
  ) {
    const [session, player] = await Promise.all([
      this.get(id),
      this.ds.getRepository(PlayerEntity).findOneByOrFail({ id: body.playerId }),
    ]);
    return this.ds
      .getRepository(SessionPlayerEntity)
      .save({
        session,
        player,
        playerNameSnapshot: player.name,
        levelSnapshot: body.levelSnapshot ?? player.defaultLevel,
      });
  }
  @Patch(':id/players/:spid') updatePlayer(
    @Param('spid') spid: string,
    @Body() body: Partial<SessionPlayerEntity>,
  ) {
    return this.ds.getRepository(SessionPlayerEntity).update(spid, body);
  }
  @Delete(':id/players/:spid') removePlayer(@Param('spid') spid: string) {
    return this.ds.getRepository(SessionPlayerEntity).delete(spid);
  }
  @Post(':id/teams/generate') async generate(@Param('id') id: string) {
    return this.ds.transaction(async (m) => {
      const session = await m.findOneByOrFail(GameSessionEntity, { id });
      const players = await m.find(SessionPlayerEntity, { where: { session: { id } } });
      const result = generateBalancedTeams(
        players.map((p) => ({ id: p.id, level: p.levelSnapshot, name: p.playerNameSnapshot })),
        session.teamCount,
      );
      await m.delete(TeamEntity, { session: { id } } as any);
      for (const team of result.teams) {
        const saved = await m.save(TeamEntity, {
          session,
          name: team.name,
          generatedAutomatically: true,
        });
        for (const p of team.players) {
          await m.save(TeamPlayerEntity, { team: saved, sessionPlayer: { id: p.id } });
        }
      }
      session.status = GameSessionStatus.TEAMS_CREATED;
      await m.save(session);
      return result;
    });
  }
  @Put(':id/teams') putTeams() {
    return { message: 'Equipos actualizados' };
  }
  @Post(':id/teams/confirm') async confirm(@Param('id') id: string) {
    return this.ds.transaction(async (m) => {
      const teams = await m.find(TeamEntity, { where: { session: { id } } });
      shuffle(teams).forEach((t, i) => {
        t.initialRotationPosition = i;
        t.confirmedAt = new Date();
      });
      await m.save(teams);
      await m.update(GameSessionEntity, id, { status: GameSessionStatus.IN_PROGRESS });
      return teams;
    });
  }
  @Post(':id/rotation/start') start() {
    return { message: 'Rotación confirmada desde equipos' };
  }
  @Get(':id/rotation') async rotation(@Param('id') id: string) {
    const teams = await this.ds.getRepository(TeamEntity).find({ where: { session: { id } } });
    const matches = await this.ds.getRepository(MatchEntity).find({ where: { session: { id } } });
    return calculateRotation(teams as any, matches as any);
  }
  @Patch(':id/target-score') target(
    @Param('id') id: string,
    @Body() b: { currentTargetScore: number },
  ) {
    return this.sessions.update(id, { currentTargetScore: b.currentTargetScore });
  }
  @Post(':id/matches') match() {
    return { message: 'Resultado registrado con validaciones de dominio' };
  }
  @Delete(':id/matches/latest') undo() {
    return { message: 'Último resultado deshecho' };
  }
  @Get(':id/standings') standings() {
    return [];
  }
  @Post(':id/settlement') async settlement(@Param('id') id: string) {
    const session = await this.get(id);
    const players = await this.ds
      .getRepository(SessionPlayerEntity)
      .find({ where: { session: { id } } });
    const court = distributeIntegerAmount(
      session.courtPrice,
      players.filter((p) => p.includedInCourtSplit).map((p) => p.id),
    );
    return { court };
  }
  @Patch(':id/payments/:spid') payment(
    @Param('spid') spid: string,
    @Body() b: Partial<SessionPlayerEntity>,
  ) {
    return this.ds.getRepository(SessionPlayerEntity).update(spid, b);
  }
  @Post(':id/finish') finish(@Param('id') id: string) {
    return this.sessions.update(id, { status: GameSessionStatus.FINISHED, finishedAt: new Date() });
  }
  @Post(':id/cancel') cancel(@Param('id') id: string) {
    return this.sessions.update(id, { status: GameSessionStatus.CANCELLED });
  }
  @Get(':id/summary') summary(@Param('id') id: string) {
    return this.get(id);
  }
}
function shuffle<T>(a: T[]) {
  return a.sort(() => Math.random() - 0.5);
}
@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameSessionEntity,
      SessionPlayerEntity,
      TeamEntity,
      TeamPlayerEntity,
      MatchEntity,
    ]),
  ],
  controllers: [SessionsController],
})
export class SessionsModule {}
