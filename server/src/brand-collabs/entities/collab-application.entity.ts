import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CollabOpportunity } from './collab-opportunity.entity';

@Entity()
export class CollabApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CollabOpportunity, opportunity => opportunity.applications)
  opportunity: CollabOpportunity;

  @Column()
  opportunityId: string;

  @ManyToOne(() => User)
  creator: User;

  @Column()
  creatorId: string;

  @Column({ type: 'text' })
  pitch: string;

  @Column()
  proposedRate: number;

  @Column({ nullable: true })
  portfolioLinks: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';

  @Column({ nullable: true })
  rejectionReason?: string;

  @CreateDateColumn()
  appliedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}