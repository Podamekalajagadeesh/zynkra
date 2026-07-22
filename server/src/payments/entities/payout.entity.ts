import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * A creator's request to withdraw their wallet balance.
 *
 * Lifecycle:
 *   pending     — awaiting a manual admin decision (no Stripe Connect configured)
 *   processing  — a Stripe transfer is in flight; finalized by webhook
 *   paid        — funds sent to the creator
 *   rejected    — admin declined; wallet balance refunded
 *   failed      — Stripe transfer failed; wallet balance refunded
 */
export type PayoutStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'rejected'
  | 'failed';

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  creator: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'usd' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: PayoutStatus;

  @Column({ type: 'varchar', nullable: true })
  purpose: string | null;

  @Column({ type: 'varchar', nullable: true })
  payoutId: string | null;

  /** Stripe transfer id when the payout is settled via Stripe Connect. */
  @Column({ type: 'varchar', nullable: true })
  stripeTransferId: string | null;

  /** Populated when a payout is rejected by an admin or fails at Stripe. */
  @Column({ type: 'varchar', nullable: true })
  failureReason: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
