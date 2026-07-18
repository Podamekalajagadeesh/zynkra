import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Gift } from './gift.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity()
export class UserGift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User)
  recipient: User;

  @ManyToOne(() => Gift)
  gift: Gift;

  @ManyToOne(() => Post, { nullable: true })
  post?: Post;

  @ManyToOne(() => Comment, { nullable: true })
  comment?: Comment;

  @Column({ nullable: true })
  message?: string;
}