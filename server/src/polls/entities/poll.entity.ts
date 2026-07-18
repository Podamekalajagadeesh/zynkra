import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { PollOption } from './poll-option.entity';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @OneToMany(() => PollOption, (option) => option.poll, { cascade: true })
  options: PollOption[];

  @ManyToOne(() => Post, (post) => post.poll)
  post: Post;
}