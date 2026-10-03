import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * An auditable record of a bias-mitigation strategy being applied.
 *
 * `applyBiasMitigations` previously pushed into an in-process array that nothing
 * ever read, so the endpoint reported success while leaving no trace — the
 * applied mitigations vanished on restart and were invisible to any other
 * instance. This makes the action durable and reviewable.
 */
@Entity('moderation_mitigations')
@Index(['appliedAt'])
export class ModerationMitigationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The mitigation strategy as submitted, stored verbatim for audit. */
  @Column({ type: 'jsonb' })
  strategy: Record<string, unknown>;

  /** Who applied it. Null for system-initiated application. */
  @Column({ type: 'uuid', nullable: true })
  appliedById: string | null;

  @Column({ type: 'timestamp' })
  appliedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
