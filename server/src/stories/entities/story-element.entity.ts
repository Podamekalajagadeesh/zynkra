import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Story } from './story.entity';

export enum StoryElementType {
  LOCATION = 'location',
  MENTION = 'mention',
  HASHTAG = 'hashtag',
  POLL = 'poll',
  QUIZ = 'quiz',
  SLIDER = 'slider',
  COUNTDOWN = 'countdown',
  DONATION = 'donation',
  QA = 'qa',
  MUSIC = 'music',
  LINK = 'link',
  STICKER = 'sticker', // For generic/GIF stickers
}

@Entity('story_elements')
export class StoryElement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: StoryElementType })
  type: StoryElementType;

  @Column({ type: 'jsonb' })
  data: any;

  @ManyToOne(() => Story, (story) => story.elements, { onDelete: 'CASCADE' })
  story: Story;
}