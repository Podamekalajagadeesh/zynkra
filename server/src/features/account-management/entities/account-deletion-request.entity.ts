import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('account_deletion_requests')
@Index('IDX_account_deletion_requests_account_status', ['accountId', 'status'])
export class AccountDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  accountId: string;

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