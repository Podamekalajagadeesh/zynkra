import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StoryElement } from './story-element.entity';

@Entity('story_poll_votes')
@Index('IDX_story_poll_votes_element_user', ['element', 'user'], { unique: true })
@Index('IDX_story_poll_votes_elementId', ['element'])
export class StoryPollVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  optionIndex: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => StoryElement, { onDelete: 'CASCADE' })
  element: StoryElement;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
