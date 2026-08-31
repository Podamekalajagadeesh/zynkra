import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

export enum VerificationHistoryEventType {
  REQUEST_SUBMITTED = 'request_submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  BADGE_GRANTED = 'badge_granted',
  BADGE_REVOKED = 'badge_revoked',
  APPEAL_SUBMITTED = 'appeal_submitted',
  APPEAL_APPROVED = 'appeal_approved',
  APPEAL_REJECTED = 'appeal_rejected',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REJECTED = 'document_rejected',
}

@Entity('verification_history')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class VerificationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: VerificationHistoryEventType,
  })
  eventType: VerificationHistoryEventType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'uuid', nullable: true })
  performedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
