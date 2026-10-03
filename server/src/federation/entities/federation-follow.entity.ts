import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RemoteUser } from './remote-user.entity';

/**
 * An inbound follow from a remote actor to a local user.
 *
 * This table did not exist, which meant the follow flow only *looked* like it
 * worked: `processSharedInbox` sent an `Accept` back, so a Mastodon user
 * believed it was followed, but nothing was persisted. The relationship therefore
 * never appeared in the local user's followers collection, and `Undo` (Follow)
 * had nothing to remove — it returned `follow-undo-processed` without touching
 * the database. Accepting a follow without recording it is worse than rejecting
 * it, because the remote side is now told a state exists that we do not hold.
 */
@Entity('federation_follows')
@Unique(['localUser', 'remoteUser'])
export class FederationFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  localUser: User;

  @Index()
  @ManyToOne(() => RemoteUser, { onDelete: 'CASCADE' })
  remoteUser: RemoteUser;

  /** The `Follow` activity id, so a replayed Follow is idempotent. */
  @Column({ nullable: true })
  followActivityId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
