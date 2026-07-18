import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity()
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.reports)
  reporter: User;

  @ManyToOne(() => Post, (post) => post.reports)
  post: Post;
}