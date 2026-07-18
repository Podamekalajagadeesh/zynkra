import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Story } from './story.entity';

@Entity('story_highlights')
export class StoryHighlight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  coverUrl: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToMany(() => Story, { eager: true })
  @JoinTable({
    name: 'story_highlight_stories',
    joinColumn: { name: 'highlightId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'storyId', referencedColumnName: 'id' },
  })
  stories: Story[];
}