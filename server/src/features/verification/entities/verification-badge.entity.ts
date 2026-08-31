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

export enum BadgeType {
  CREATOR = 'creator',
  BUSINESS = 'business',
  ORGANIZATION = 'organization',
  VERIFIED_IDENTITY = 'verified_identity',
  VERIFIED_AGE = 'verified_age',
  OFFICIAL = 'official',
  TRUSTED = 'trusted',
}

@Entity('verification_badges')
@Index(['userId', 'type'])
export class VerificationBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: BadgeType,
  })
  type: BadgeType;

  @Column({ type: 'text', nullable: true })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  iconUrl: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  grantedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  grantedBy: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  revocationReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;
}
