import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * A failed outbound federation delivery awaiting (or refusing) redrive.
 *
 * `deliverToInbox` retries inside a single request — three attempts, capped
 * backoff — but a peer that is down for longer than that, or returns 5xx after
 * the in-request attempts are exhausted, used to be *reported* in a
 * `FederationReport` and then forgotten. `POST /federation/posts/:id/redrive`
 * covered the manual case; there was nothing to retry from automatically, so
 * an outage on one peer silently dropped every activity fanned out during it.
 *
 * This table is that queue: the activity payload is retained verbatim (redrive
 * must send the same object the outbox recorded, and `Delete`/`Undo` must wrap
 * the exact activity id the peer may have received), and a scheduled job
 * re-delivers with a much longer backoff than an in-request retry can afford.
 * Deliveries that can never succeed (signature rejected, instance blocked,
 * attempts exhausted) are marked `dead` and kept for inspection rather than
 * deleted — the failure is data, not noise.
 */
@Entity('federation_delivery_attempts')
@Index('IDX_federation_delivery_pending', ['dead', 'completedAt', 'nextRetryAt'])
@Index('IDX_federation_delivery_activity', ['activityId', 'inboxUrl'])
export class FederationDeliveryAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The activity id from the outbox — what an Undo would reference. */
  @Column()
  activityId: string;

  /** `Create`, `Like`, `Announce`, `Update`, `Delete`, `Follow`, ... */
  @Column({ length: 32 })
  activityType: string;

  /** Verbatim JSON of the activity. Redrive must re-send the same bytes. */
  @Column('text')
  payload: string;

  @Column()
  inboxUrl: string;

  @Column()
  instanceDomain: string;

  /** Username the delivery is signed as; needed to re-sign on redrive. */
  @Column({ nullable: true })
  actorUsername: string | null;

  /** Redrive cycles attempted (in-request retries are not counted here). */
  @Column({ type: 'int', default: 1 })
  attempts: number;

  @Column({ type: 'int', nullable: true })
  lastStatus: number | null;

  @Column({ type: 'text', nullable: true })
  lastReason: string | null;

  /** False for deterministic rejections (401/403/4xx) — retrying cannot help. */
  @Column({ type: 'boolean', default: true })
  retryable: boolean;

  /** True once the row is finished: delivered, dead, or given up on. */
  @Column({ type: 'boolean', default: false })
  dead: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextRetryAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
