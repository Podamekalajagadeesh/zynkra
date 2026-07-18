import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Story } from './story.entity';

@Entity('story_replies')
export class StoryReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Story, (story) => story.replies)
  story: Story;

  @CreateDateColumn()
  createdAt: Date;
}