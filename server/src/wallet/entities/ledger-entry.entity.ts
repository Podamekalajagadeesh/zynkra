import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Append-only record of every wallet balance movement. One row per credit or
 * debit, written in the same transaction that mutates `User.walletBalance`, so
 * the ledger is always an exact, auditable history of the balance.
 *
 * `amount` is signed: positive for credits (earnings, payout reversals),
 * negative for debits (payouts). `balanceAfter` snapshots the resulting balance.
 */
export type LedgerEntryType =
  | 'earning'
  | 'payout'
  | 'payout_reversal'
  | 'adjustment';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 30, default: 'earning' })
  type: LedgerEntryType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  /** External reference this entry relates to, e.g. a payoutId or paymentId. */
  @Column({ type: 'varchar', nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', nullable: true })
  purpose: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
