
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity()
@Unique(['user', 'post'])
export class Watchlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.watchlist)
  user: User;

  @ManyToOne(() => Post, (post) => post.watchlist)
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}