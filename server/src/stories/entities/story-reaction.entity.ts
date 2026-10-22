import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Story } from './story.entity';

@Entity('story_reactions')
@Index('IDX_story_reactions_story_user', ['story', 'user'], { unique: true })
export class StoryReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reaction: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Story, (story) => story.reactions, { onDelete: 'CASCADE' })
  story: Story;
}
