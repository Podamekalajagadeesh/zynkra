import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity()
export class SponsoredPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  sponsor: User;

  @ManyToOne(() => Post)
  post: Post;

  @Column()
  budget: number;

  @Column()
  expiresAt: Date;
}