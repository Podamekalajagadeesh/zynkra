import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Story } from './story.entity';

@Entity('story_replies')
// Owner inbox reads: WHERE storyId = ? ORDER BY createdAt DESC (FKs are not auto-indexed).
@Index('IDX_story_replies_story_createdAt', ['story', 'createdAt'])
export class StoryReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Story, (story) => story.replies, { onDelete: 'CASCADE' })
  story: Story;

  @CreateDateColumn()
  createdAt: Date;
}
