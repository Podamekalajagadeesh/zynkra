import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

// Read-model over the `follows` ManyToMany join table declared on User
// (user.entity.ts @JoinTable). synchronize: false — the join table owns the
// schema; followedAt is added by the baseline migration with a DB default.
@Entity('follows', { synchronize: false })
export class Follow {
  @PrimaryColumn('uuid')
  followerId: string;

  @PrimaryColumn('uuid')
  followingId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followingId' })
  following: User;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  followedAt: Date;
}
