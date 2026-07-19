import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Proposal } from './proposal.entity';

// Distinct table name: groups/entities/vote.entity.ts already owns "vote".
@Entity('dao_vote')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  voter: User;

  @ManyToOne(() => Proposal, (proposal) => proposal.votes)
  proposal: Proposal;

  @Column()
  support: boolean; // true for 'yes', false for 'no'
}