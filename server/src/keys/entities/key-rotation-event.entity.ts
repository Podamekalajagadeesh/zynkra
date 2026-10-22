import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * An audit trail of E2EE key-material changes for one user.
 *
 * Signal-style rotation is invisible to peers unless something records that it
 * happened: an initiator fetches a bundle and gets whatever the current keys
 * are, with no way to tell whether the identity key under an existing session
 * is still the one the session was established with. This table is that
 * signal — clients poll `GET /keys/rotation-events?since=` (own events) or read
 * `GET /keys/identity/:userId` (someone else's current identity + when it last
 * changed) and re-establish a session when the identity key moved.
 *
 * The server never stores private key material; these are metadata rows only.
 */
@Entity('key_rotation_events')
@Index('IDX_key_rotation_user_kind', ['userId', 'kind', 'createdAt'])
export class KeyRotationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** `identity`, `signed-prekey`, or `one-time-prekeys`. */
  @Column({ length: 32 })
  kind: string;

  /** The keyId involved, when the event is about one specific key. */
  @Column({ type: 'int', nullable: true })
  keyId: number | null;

  /** Free-form context (e.g. batch size for one-time pre-key uploads). */
  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
