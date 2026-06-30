import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { CommunityChallenge } from './community-challenge.entity';
import { User } from '../../users/entities/user.entity';
import { ContributionType } from '../enums/contribution-type.enum';

@Entity('challenge_contributions')
export class ChallengeContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ContributionType,
  })
  type: ContributionType;

  @Column({ nullable: true })
  amount?: number; // For monetary contributions
  @Column({ type: 'text', nullable: true })
  message?: string; // Optional message from contributor
  @Column({ nullable: true })
  transactionHash?: string; // For crypto transactions

  @ManyToOne(() => CommunityChallenge, (challenge) => challenge.contributions)
  challenge: CommunityChallenge;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}