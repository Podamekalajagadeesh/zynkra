import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Reputation } from './reputation.entity';
import { ReputationEvent } from '../reputation.enum';

@Entity()
export class ReputationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Reputation, (reputation) => reputation.logs)
  reputation: Reputation;

  @Column({ type: 'enum', enum: ReputationEvent })
  event: ReputationEvent;

  // numeric(10,2), not the default integer: INTERACTION_RECEIVED awards 0.5
  // points and an integer column rejects it (see migration 1792325581000).
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cryptocurrencyEarned: number; // Cryptocurrency earned for this event

  @CreateDateColumn()
  createdAt: Date;
}
