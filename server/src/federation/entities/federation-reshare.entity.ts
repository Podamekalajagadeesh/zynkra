import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

/**
 * One remote actor's boost (Announce) of one of our local posts.
 *
 * This table is the idempotency and Undo ledger for inbound boosts. The post's
 * `shareCount` is incremented exactly once per row, so a re-delivered Announce
 * cannot inflate the counter, and an Undo can only decrement after removing a
 * row that this instance itself incremented. Columns are plain on purpose:
 * `localPostId` carries the reference directly, so a deleted post cascades
 * without loading the entity.
 */
@Entity('federation_reshares')
@Unique('UQ_federation_reshares_target', ['localPostId', 'remoteActorUrl'])
export class FederationReshare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The inbound Announce activity id, for audit and cross-instance tracing. */
  @Column({ type: 'varchar', nullable: true })
  activityId?: string | null;

  @Column({ type: 'uuid' })
  localPostId: string;

  /** The remote actor's ActivityPub id (no local account exists for them). */
  @Column({ type: 'varchar' })
  remoteActorUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
