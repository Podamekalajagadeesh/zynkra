import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from '../../users/entities/user.entity';
import { ChallengeContribution } from './challenge-contribution.entity';
import { ChallengeType } from '../enums/challenge-type.enum';
import { ChallengeStatus } from '../enums/challenge-status.enum';

@Entity('community_challenges')
export class CommunityChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ChallengeType,
  })
  type: ChallengeType;

  @Column({
    type: 'enum',
    enum: ChallengeStatus,
    default: ChallengeStatus.ACTIVE,
  })
  status: ChallengeStatus;

  @Column({ nullable: true })
  goalAmount?: number; // For fundraisers - monetary goal
  @Column({ nullable: true })
  currentAmount?: number; // Current raised amount for fundraisers
  @Column({ nullable: true })
  goalParticipantCount?: number; // For group goals - target participants
  @Column({ nullable: true })
  currentParticipantCount?: number; // Current participants
  @Column({ nullable: true })
  goalActionCount?: number; // For action-based goals (e.g., "collect 1000 signatures")
  @Column({ nullable: true })
  currentActionCount?: number; // Current actions completed

  @Column({ nullable: true })
  startDate: Date;
  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  imageUrl?: string;
  @Column({ nullable: true })
  linkUrl?: string; // External link for more info/donations

  @ManyToOne(() => Group, (group) => group.challenges)
  group: Group;

  @ManyToOne(() => User)
  creator: User;

  @OneToMany(() => ChallengeContribution, (contribution) => contribution.challenge)
  contributions: ChallengeContribution[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}