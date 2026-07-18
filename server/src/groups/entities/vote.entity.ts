import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Proposal } from './proposal.entity';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  voter: User;

  @ManyToOne(() => Proposal, (proposal) => proposal.votes)
  proposal: Proposal;

  @Column()
  choice: boolean; // true for 'for', false for 'against'

  @Column({ type: 'decimal', default: 1 })
  weight: number;

  @CreateDateColumn()
  createdAt: Date;
}