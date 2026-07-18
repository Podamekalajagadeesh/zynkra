import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @Column()
  followerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followingId' })
  following: User;

  @Column()
  followingId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  followedAt: Date;
}