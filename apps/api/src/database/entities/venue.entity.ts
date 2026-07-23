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
  @Column() name!: string;
  @Column({ type: 'text', nullable: true }) address!: string | null;
  @Column({ name: 'default_court_price', type: 'int', default: 0 }) defaultCourtPrice!: number;
  @Column({ name: 'default_gatorade_price', type: 'int', default: 0 })
  defaultGatoradePrice!: number;
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
