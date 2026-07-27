import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('venues')
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
