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

  @Column()
  points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cryptocurrencyEarned: number; // Cryptocurrency earned for this event

  @CreateDateColumn()
  createdAt: Date;
}