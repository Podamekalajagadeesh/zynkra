import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tag } from '../tags/tag.entity';

@Entity('user_interests')
export class UserInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => User, (user) => user.interests)
  user: User;

  @ManyToOne(() => Tag, (tag) => tag.userInterests)
  tag: Tag;

  @Column('float', { default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  interactionCount: number;

  @CreateDateColumn({ name: 'first_seen' })
  firstSeen: Date;

  @Column({ name: 'last_updated' })
  lastUpdated: Date;
}