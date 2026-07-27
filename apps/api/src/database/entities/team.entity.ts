import {
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
@Entity('teams')
@Index(['session', 'name'], { unique: true })
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => GameSessionEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: GameSessionEntity;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'text', nullable: true }) color!: string | null;
  @Column({ name: 'initial_rotation_position', type: 'int', nullable: true })
  initialRotationPosition!: number | null;
  @Column({ name: 'generated_automatically', type: 'boolean', default: true })
  generatedAutomatically!: boolean;
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true }) confirmedAt!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
