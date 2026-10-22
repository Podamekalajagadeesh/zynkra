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
import { User } from '../../../users/entities/user.entity';

@Entity('account_deletion_requests')
@Index('IDX_account_deletion_requests_account_status', ['accountId', 'status'])
export class AccountDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  accountId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  user: User;

  @Column({ type: 'varchar', length: 40 })
  reason: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  additionalInfo?: string;

  @Column({ default: true })
  deleteLinkedAccounts: boolean;

  @Column({ default: true })
  deleteAllData: boolean;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'deleted';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date;
}
