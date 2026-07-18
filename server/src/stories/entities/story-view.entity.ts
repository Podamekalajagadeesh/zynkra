import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Story } from './story.entity';

@Entity('story_views')
export class StoryView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ type: 'timestamp with time zone', array: true, default: [] })
  viewTimestamps: Date[];

  @Column({ default: 1 })
  rewatchCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Story)
  story: Story;
}