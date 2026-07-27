import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('venues')
@Check('CHK_venues_default_court_price', 'default_court_price >= 0')
@Check('CHK_venues_default_gatorade_price', 'default_gatorade_price >= 0')
export class VenueEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'text', nullable: true }) address!: string | null;
  @Column({ name: 'default_court_price', type: 'int', default: 0 }) defaultCourtPrice!: number;
  @Column({ name: 'default_gatorade_price', type: 'int', default: 0 })
  defaultGatoradePrice!: number;
  @Column({ type: 'boolean', default: true }) active!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
