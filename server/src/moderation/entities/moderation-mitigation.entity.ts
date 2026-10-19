import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * An auditable record of a bias-mitigation strategy being applied.
 *
 * `applyBiasMitigations` previously pushed into an in-process array that nothing
 * ever read, so the endpoint reported success while leaving no trace — the
 * applied mitigations vanished on restart and were invisible to any other
 * instance. This makes the action durable and reviewable.
 */
@Entity('moderation_mitigations')
@Index('idx_moderation_mitigations_applied_at', ['appliedAt'])
export class ModerationMitigationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The mitigation strategy as submitted, stored verbatim for audit. */
  @Column({ type: 'jsonb' })
  strategy: Record<string, unknown>;

  /** Who applied it. Null for system-initiated application. */
  @Column({ type: 'uuid', nullable: true })
  appliedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appliedById' })
  appliedBy: User | null;

  @Column({ type: 'timestamp', default: () => 'now()' })
  appliedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
