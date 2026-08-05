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

// Per-local-user moderation state against a remote (federated) user. A single
// row holds both block and mute flags so one (localUser, remoteUser) pair maps
// to exactly one moderation record.
@Entity('federation_moderations')
@Unique(['localUser', 'remoteUser'])
export class FederationModeration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  localUser: User;

  @Index()
  @ManyToOne(() => RemoteUser, { onDelete: 'CASCADE' })
  remoteUser: RemoteUser;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'boolean', default: false })
  isMuted: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
