import { UserRole } from '@volleyflow/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'varchar', unique: true }) email!: string;
  @Column({ name: 'password_hash', type: 'varchar' }) passwordHash!: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.ORGANIZER }) role!: UserRole;
  @Column({ type: 'boolean', default: true }) active!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
