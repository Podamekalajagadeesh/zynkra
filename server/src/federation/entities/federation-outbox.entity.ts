import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * An activity this instance has sent to a peer.
 *
 * ActivityPub is not fire-and-forget. `Delete` must wrap the id of the `Create`
 * the peer actually received, and `Undo` must wrap the id of the `Like` or
 * `Announce` it is retracting. That means the sending instance has to remember
 * what it sent, keyed by what it sent it about.
 *
 * Until now it tried to get that from `federated_posts` — a table that stores
 * *inbound* remote content — and it stored the wrong identifier:
 * `federatePost` recorded `activity.id` (`/federation/activities/<uuid>`) while
 * `findFederatedActivityId` searched for the Note id
 * (`/federation/posts/<postId>`). Those can never be equal, so
 * `federateDelete` always took the "no recorded federated activity" branch and
 * emitted nothing. Retraction was implemented and never fired. The existing
 * test missed it because it stubbed `findOne` to return a matching row rather
 * than round-tripping a real `federatePost` into a real `federateDelete`.
 *
 * This table is the ledger those lookups were reaching for.
 */
@Entity('federation_outbox')
@Index('IDX_federation_outbox_object', ['objectId', 'activityType'])
export class FederationOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The activity id we minted and signed — the id an Undo must reference. */
  @Column({ unique: true })
  activityId: string;

  /** The id of the object this activity acts on. */
  @Column({ nullable: true })
  objectId: string;

  /** `Create`, `Like`, `Announce`, `Update`, `Delete`. */
  @Column({ length: 32 })
  activityType: string;

  /** The local author of the activity. */
  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  localUser: User;

  /** Instances that accepted it. Used to re-target an Update or Undo. */
  @Column('simple-array', { nullable: true })
  deliveredTo: string[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
