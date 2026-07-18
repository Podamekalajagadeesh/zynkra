import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
}

@Entity('skill_communities')
export class SkillCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  skills?: string[];

  @Column({ type: 'integer', default: 0 })
  memberCount: number;

  @Column({ type: 'integer', default: 0 })
  exchangeCount: number;

  @Column({ nullable: true })
  creatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('skill_community_members')
export class SkillCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => SkillCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: SkillCommunity;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'simple-array', nullable: true })
  offeringSkills?: string[];

  @Column({ type: 'simple-array', nullable: true })
  seekingSkills?: string[];

  @CreateDateColumn()
  joinedAt: Date;
}

@Entity('skill_exchanges')
export class SkillExchange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => SkillCommunity)
  @JoinColumn({ name: 'communityId' })
  community?: SkillCommunity;

  @Column()
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester?: User;

  @Column({ nullable: true })
  providerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'providerId' })
  provider?: User;

  @Column({ type: 'text', nullable: true })
  offeredSkill?: string;

  @Column({ type: 'text', nullable: true })
  requestedSkill?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
