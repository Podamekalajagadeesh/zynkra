import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../../users/entities/user.entity';

export type AccountRecoveryRequestStatus = 'pending' | 'approved' | 'rejected';

@Entity('account_recovery_requests')
@Index(['accountId', 'createdAt'])
export class AccountRecoveryRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: User;

  @Column({ type: 'varchar', length: 32 })
  method: 'email' | 'trusted_contact' | 'passkey';

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: AccountRecoveryRequestStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date | null;
}
