import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from './post.entity';

@Entity('post_reactions')
export class PostReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reaction: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Post, (post) => post.reactions)
  post: Post;
}