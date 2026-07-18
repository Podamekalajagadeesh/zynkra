import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RemoteInstance } from './remote-instance.entity';
import { RemotePost } from './remote-post.entity';

@Entity('federated_users')
export class RemoteUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  actorId: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  headerUrl: string;

  @Column({ nullable: true })
  inboxUrl: string;

  @Column({ nullable: true })
  outboxUrl: string;

  @Column({ nullable: true })
  followersUrl: string;

  @Column({ nullable: true })
  followingUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RemoteInstance, (instance) => instance.remoteUsers)
  instance: RemoteInstance;

  @OneToMany(() => RemotePost, (post) => post.author)
  posts: RemotePost[];
}