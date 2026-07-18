import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AccessibilityNeedType {
  PHYSICAL = 'physical',
  COGNITIVE = 'cognitive',
  VISUAL = 'visual',
  HEARING = 'hearing',
  SPEECH = 'speech',
  SENSORY = 'sensory',
}

export enum InterfacePreset {
  LOW_STIMULUS = 'low_stimulus',
  HIGH_CONTRAST = 'high_contrast',
  LARGE_TEXT = 'large_text',
  SLOW_ANIMATIONS = 'slow_animations',
  SCREEN_READER_FIRST = 'screen_reader_first',
  KEYBOARD_NAV_ONLY = 'keyboard_nav_only',
  CUSTOM = 'custom',
}

export enum AccommodationRequestStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  READY = 'ready',
  FULFILLED = 'fulfilled',
}

@Entity('accessibility_first_communities')
export class AccessibilityFirstCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'simple-array' })
  supportedNeeds: AccessibilityNeedType[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  interfaceProfiles?: InterfacePreset[];

  @Column({ type: 'json', nullable: true })
  accessibilityFeatures?: string[];

  @Column({ type: 'json', nullable: true })
  customInterfaceTemplates?: string[];

  @Column({ type: 'integer', default: 0 })
  memberCount: number;

  @Column({ type: 'integer', default: 0 })
  activeRequests: number;

  @Column({ nullable: true })
  creatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator?: User;

  @OneToMany(() => AccessibilityCommunityMember, (member) => member.community)
  members?: AccessibilityCommunityMember[];

  @OneToMany(() => AccessibilityAccommodationRequest, (request) => request.community)
  accommodationRequests?: AccessibilityAccommodationRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('accessibility_community_members')
export class AccessibilityCommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => AccessibilityFirstCommunity, (community) => community.members)
  @JoinColumn({ name: 'communityId' })
  community?: AccessibilityFirstCommunity;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'text', nullable: true })
  role?: string;

  @Column({ type: 'simple-array', nullable: true })
  accessibilityNeeds?: AccessibilityNeedType[];

  @Column({ type: 'enum', enum: InterfacePreset, nullable: true })
  preferredPreset?: InterfacePreset;

  @Column({ type: 'json', nullable: true })
  customSettings?: Record<string, any>;

  @CreateDateColumn()
  joinedAt: Date;
}

@Entity('accessibility_accommodation_requests')
export class AccessibilityAccommodationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  communityId: string;

  @ManyToOne(() => AccessibilityFirstCommunity, (community) => community.accommodationRequests)
  @JoinColumn({ name: 'communityId' })
  community?: AccessibilityFirstCommunity;

  @Column({ nullable: true })
  requesterId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requesterId' })
  requester?: User;

  @Column({ type: 'enum', enum: AccessibilityNeedType })
  needType: AccessibilityNeedType;

  @Column({ type: 'enum', enum: AccommodationRequestStatus, default: AccommodationRequestStatus.OPEN })
  status: AccommodationRequestStatus;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', nullable: true })
  requestedAdjustments?: string[];

  @Column({ type: 'json', nullable: true })
  interfaceSettings?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}