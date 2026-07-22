import { GameSessionStatus } from '@volleyflow/shared';
import {
  Column,
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
export class GameSessionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'date' }) date!: string;
  @Column({ name: 'start_time', type: 'time', nullable: true }) startTime!: string | null;
  @ManyToOne(() => VenueEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'venue_id' })
  venue!: VenueEntity | null;
  @Column({ name: 'venue_name_snapshot' }) venueNameSnapshot!: string;
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
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true }) finishedAt!: Date | null;
}
