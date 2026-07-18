import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('bereal_posts')
export class BerealPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  post: Post;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  postedAt: Date;

  @Column({ type: 'timestamp with time zone' })
  windowStartTime: Date;

  @Column({ type: 'int' })
  timeTakenSeconds: number; // How long it took the user to post after the window opened
}