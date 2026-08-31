import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

export enum TrustLevel {
  UNKNOWN = 'unknown',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERIFIED = 'verified',
}

@Entity('trust_indicators')
@Index(['userId'])
export class TrustIndicator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: TrustLevel,
    default: TrustLevel.UNKNOWN,
  })
  trustLevel: TrustLevel;

  @Column({ type: 'int', default: 0 })
  trustScore: number;

  @Column({ type: 'int', default: 0 })
  verificationCount: number;

  @Column({ type: 'int', default: 0 })
  badgeCount: number;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  hasCompletedIdentityVerification: boolean;

  @Column({ type: 'boolean', default: false })
  hasCompletedAgeVerification: boolean;

  @Column({ type: 'int', default: 0 })
  accountAgeInDays: number;

  @Column({ type: 'int', default: 0 })
  postCount: number;

  @Column({ type: 'int', default: 0 })
  followerCount: number;

  @Column({ type: 'boolean', default: false })
  hasProfilePhoto: boolean;

  @Column({ type: 'boolean', default: false })
  hasCompletedProfile: boolean;

  @Column({ type: 'int', default: 0 })
  reportCount: number;

  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  @Column({ type: 'simple-json', nullable: true })
  badges: string[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
