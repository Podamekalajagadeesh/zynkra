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

export enum LoginApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('login_approvals')
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
export class LoginApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar' })
  deviceName: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'varchar', nullable: true })
  browser: string | null;

  @Column({ type: 'varchar', nullable: true })
  os: string | null;

  @Column({
    type: 'enum',
    enum: LoginApprovalStatus,
    default: LoginApprovalStatus.PENDING,
  })
  status: LoginApprovalStatus;

  @Column({ type: 'varchar', nullable: true })
  approvalToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reviewerNote: string | null;

  @Column({ type: 'boolean', default: false })
  rememberDevice: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
