import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CrisisResponseFocus {
  DISASTER_RELIEF = 'disaster_relief',
  MENTAL_HEALTH_SUPPORT = 'mental_health_support',
  EMERGENCY_AID = 'emergency_aid',
  SHELTER_COORDINATION = 'shelter_coordination',
  RECOVERY_PLANNING = 'recovery_planning',
}

export enum AidRequestType {
  FOOD = 'food',
  WATER = 'water',
  SHELTER = 'shelter',
  MEDICAL = 'medical',
  TRANSPORT = 'transport',
  MENTAL_HEALTH = 'mental_health',
  SUPPLIES = 'supplies',
}

export enum AidRequestStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  FULFILLED = 'fulfilled',
  CLOSED = 'closed',
}

@Entity('crisis_response_communities')
export class CrisisResponseCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'simple-array' })
  focusAreas: CrisisResponseFocus[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  regions?: string[];

  @Column({ type: 'json', nullable: true })
  supportChannels?: string[];

  @Column({ type: 'integer', default: 0 })
  memberCount: number;

  @Column({ type: 'integer', default: 0 })
  activeAidRequests: number;

  @Column({ nullable: true })
  creatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @OneToMany(() => CrisisResponseCommunityMember, (member) => member.community)
  members?: CrisisResponseCommunityMember[];

  @OneToMany(() => CrisisAidRequest, (request) => request.community)
  aidRequests?: CrisisAidRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('crisis_response_community_members')
export class CrisisResponseCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => CrisisResponseCommunity, (community) => community.members)
  @JoinColumn({ name: 'communityId' })
  community?: CrisisResponseCommunity;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'text', nullable: true })
  role?: string;

  @Column({ type: 'json', nullable: true })
  skillsToOffer?: string[];

  @Column({ type: 'json', nullable: true })
  supportPreference?: string[];

  @CreateDateColumn()
  joinedAt: Date;
}

@Entity('crisis_aid_requests')
export class CrisisAidRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => CrisisResponseCommunity, (community) => community.aidRequests)
  @JoinColumn({ name: 'communityId' })
  community?: CrisisResponseCommunity;

  @Column({ nullable: true })
  requesterId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requesterId' })
  requester?: User;

  @Column({ type: 'enum', enum: AidRequestType })
  requestType: AidRequestType;

  @Column({ type: 'enum', enum: AidRequestStatus, default: AidRequestStatus.OPEN })
  status: AidRequestStatus;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @Column({ type: 'json', nullable: true })
  resourcesNeeded?: string[];

  @Column({ type: 'text', nullable: true })
  contactInfo?: string;

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}