import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameSessionEntity } from './game-session.entity';
import { TeamEntity } from './team.entity';
import { MatchStatus } from '@volleyflow/shared';
@Entity('matches')
@Index(['session', 'sequence'], { unique: true })
@Check('CHK_matches_scores', 'team_a_score >= 0 and team_b_score >= 0 and target_score > 0')
@Check('CHK_matches_teams', 'team_a_id <> team_b_id')
@Check(
  'CHK_matches_result',
  `(status = 'IN_PROGRESS' and winner_team_id is null and loser_team_id is null and finished_at is null) or (status = 'FINISHED' and winner_team_id is not null and loser_team_id is not null and finished_at is not null and winner_team_id <> loser_team_id and winner_team_id in (team_a_id, team_b_id) and loser_team_id in (team_a_id, team_b_id))`,
)
export class MatchEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => GameSessionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: GameSessionEntity;
  @Column({ type: 'int' }) sequence!: number;
  @ManyToOne(() => TeamEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_a_id' })
  teamA!: TeamEntity;
  @ManyToOne(() => TeamEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_b_id' })
  teamB!: TeamEntity;
  @Column({ name: 'team_a_score', type: 'int', default: 0 }) teamAScore!: number;
  @Column({ name: 'team_b_score', type: 'int', default: 0 }) teamBScore!: number;
  @Column({ name: 'target_score', type: 'int' }) targetScore!: number;
  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.IN_PROGRESS })
  status!: MatchStatus;
  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'winner_team_id' })
  winnerTeam!: TeamEntity | null;
  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loser_team_id' })
  loserTeam!: TeamEntity | null;
  @Column({ name: 'started_at', type: 'timestamptz' }) startedAt!: Date;
  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true }) finishedAt!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
