import { GameSessionStatus } from '@volleyflow/shared';
import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VenueEntity } from './venue.entity';
import { TeamEntity } from './team.entity';
@Entity('game_sessions')
@Check(
  'CHK_sessions_values',
  'court_price >= 0 and gatorade_price >= 0 and team_count >= 2 and default_target_score > 0 and current_target_score > 0',
)
export class GameSessionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'date' }) date!: string;
  @Column({ name: 'start_time', type: 'time', nullable: true }) startTime!: string | null;
  @ManyToOne(() => VenueEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'venue_id' })
  venue!: VenueEntity | null;
  @Column({ name: 'venue_name_snapshot', type: 'varchar' }) venueNameSnapshot!: string;
  @Column({ name: 'court_price', type: 'int', default: 0 }) courtPrice!: number;
  @Column({ name: 'gatorade_price', type: 'int', default: 0 }) gatoradePrice!: number;
  @Column({ name: 'team_count', type: 'int', default: 2 }) teamCount!: number;
  @Column({ name: 'default_target_score', type: 'int', default: 21 }) defaultTargetScore!: number;
  @Column({ name: 'current_target_score', type: 'int', default: 21 }) currentTargetScore!: number;
  @Column({ type: 'enum', enum: GameSessionStatus, default: GameSessionStatus.DRAFT })
  status!: GameSessionStatus;
  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'champion_team_id' })
  championTeam!: TeamEntity | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true }) finishedAt!: Date | null;
}
