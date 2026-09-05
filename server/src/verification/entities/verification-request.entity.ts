import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum VerificationCategory {
  CREATOR = 'creator',
  BUSINESS = 'business',
  JOURNALIST = 'journalist',
  GOVERNMENT = 'government',
  NONPROFIT = 'nonprofit',
  OTHER = 'other',
}

export enum VerificationWorkflow {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  ORGANIZATION = 'organization',
}

@Entity('verification_requests')
export class VerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'enum', enum: VerificationWorkflow, default: VerificationWorkflow.PERSONAL })
  workflow: VerificationWorkflow;

  @Column({ type: 'enum', enum: VerificationCategory })
  category: VerificationCategory;

  @Column({ type: 'varchar', nullable: true })
  organizationName: string | null;

  @Column({ type: 'varchar', nullable: true })
  documentType: string | null;

  /** Applicant's case: who they are and why they qualify. */
  @Column({ type: 'text' })
  justification: string;

  /** Supporting links (press coverage, official site, other verified profiles). */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  links: string[];

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  status: VerificationStatus;

  /** Reviewer note shown to the applicant on rejection. */
  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @ManyToOne(() => User, { nullable: true })
  reviewedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
