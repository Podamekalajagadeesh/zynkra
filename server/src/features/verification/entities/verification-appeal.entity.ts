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

export enum VerificationAppealStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('verification_appeals')
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
export class VerificationAppeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar' })
  requestId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'simple-array', nullable: true })
  documentUrls: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  links: string[] | null;

  @Column({
    type: 'enum',
    enum: VerificationAppealStatus,
    default: VerificationAppealStatus.PENDING,
  })
  status: VerificationAppealStatus;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;
}
