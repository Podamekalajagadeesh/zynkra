import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Story } from './story.entity';

@Entity('story_reactions')
export class StoryReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reaction: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Story, (story) => story.reactions)
  story: Story;
}