import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Collection } from './collection.entity';

@Entity()
@Unique(['user', 'post'])
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.bookmarks)
  user: User;

  @ManyToOne(() => Post, (post) => post.bookmarks)
  post: Post;

  @ManyToOne(() => Collection, (collection) => collection.bookmarks, { nullable: true })
  collection: Collection;

  @CreateDateColumn()
  createdAt: Date;
}