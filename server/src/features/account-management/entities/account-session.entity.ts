import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('account_sessions')
@Index(['accountId', 'status'])
export class AccountSessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'varchar', length: 120 })
  deviceName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: 'active' | 'revoked';

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  lastSeenAt: Date;
}
