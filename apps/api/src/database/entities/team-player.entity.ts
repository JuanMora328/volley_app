import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TeamEntity } from './team.entity';
import { SessionPlayerEntity } from './session-player.entity';
@Entity('team_players')
@Index(['team', 'sessionPlayer'], { unique: true })
@Index(['sessionPlayer'], { unique: true })
export class TeamPlayerEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => TeamEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;
  @ManyToOne(() => SessionPlayerEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_player_id' })
  sessionPlayer!: SessionPlayerEntity;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
