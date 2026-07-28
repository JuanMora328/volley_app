import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { VenueEntity } from './venue.entity';

export const APP_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

@Entity('app_settings')
@Check('CHK_app_settings_singleton', `id = '${APP_SETTINGS_ID}'`)
@Check(
  'CHK_app_settings_values',
  'default_team_count >= 2 and default_target_score > 0 and default_court_price >= 0 and default_gatorade_price >= 0',
)
export class AppSettingsEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'organization_name', type: 'varchar' }) organizationName!: string;
  @Column({ name: 'default_team_count', type: 'int' }) defaultTeamCount!: number;
  @Column({ name: 'default_target_score', type: 'int' }) defaultTargetScore!: number;
  @Column({ name: 'default_court_price', type: 'int' }) defaultCourtPrice!: number;
  @Column({ name: 'default_gatorade_price', type: 'int' }) defaultGatoradePrice!: number;
  @ManyToOne(() => VenueEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_venue_id' })
  defaultVenue!: VenueEntity | null;
  @Column({ type: 'varchar', default: 'America/Bogota' }) timezone!: string;
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy!: UserEntity | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
