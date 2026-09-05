import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VerificationRequest } from './verification-request.entity';

export enum VerificationAppealStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('verification_appeals')
@Index(['requestId', 'status'])
@Index(['userId', 'submittedAt'])
export class VerificationAppeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => VerificationRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request: VerificationRequest;

  @Column('uuid')
  requestId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  documentUrls: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  links: string[];

  @Column({ type: 'enum', enum: VerificationAppealStatus, default: VerificationAppealStatus.PENDING })
  status: VerificationAppealStatus;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}