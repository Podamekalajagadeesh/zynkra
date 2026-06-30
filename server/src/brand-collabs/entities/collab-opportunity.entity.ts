import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Brand } from './brand.entity';
import { CollabApplication } from './collab-application.entity';

@Entity()
export class CollabOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  requirements: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budget: number;

  @Column()
  paymentType: 'fixed' | 'commission' | 'hybrid';

  @Column({ nullable: true })
  commissionRate?: number;

  @Column()
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  requiredPlatforms: string[];

  @Column({ type: 'simple-array', nullable: true })
  requiredNiches: string[];

  @Column({ default: 1 })
  minFollowers: number;

  @Column()
  deadline: Date;

  @Column({ default: 'open' })
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';

  @ManyToOne(() => Brand, brand => brand.opportunities)
  brand: Brand;

  @Column()
  brandId: string;

  @OneToMany(() => CollabApplication, application => application.opportunity)
  applications: CollabApplication[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}