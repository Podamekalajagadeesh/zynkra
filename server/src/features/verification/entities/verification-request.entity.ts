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

export enum VerificationRequestType {
  CREATOR = 'creator',
  BUSINESS = 'business',
  ORGANIZATION = 'organization',
  IDENTITY = 'identity',
  AGE = 'age',
}

export enum VerificationRequestStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  APPEAL_PENDING = 'appeal_pending',
}

@Entity('verification_requests')
@Index(['userId', 'type'])
@Index(['status', 'submittedAt'])
export class VerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: VerificationRequestType,
  })
  type: VerificationRequestType;

  @Column({
    type: 'enum',
    enum: VerificationRequestStatus,
    default: VerificationRequestStatus.PENDING,
  })
  status: VerificationRequestStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  documentUrl: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', default: 0 })
  appealCount: number;

  @Column({ type: 'timestamp', nullable: true })
  nextAppealEligibleAt: Date | null;
}
