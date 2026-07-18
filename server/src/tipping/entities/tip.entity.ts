
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
// import { Stream } from '../../livestream/entities/stream.entity'; // Moved to broken-modules

@Entity()
export class Tip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  from: User;

  @ManyToOne(() => User, { eager: true })
  to: User;

  @Column('decimal')
  amount: number;

  @Column()
  txHash: string;

  @ManyToOne(() => Post, { nullable: true })
  post: Post;

  // @ManyToOne(() => Stream { nullable: true }) // Stream moved to broken-modules
  // stream: Stream;

  @CreateDateColumn()
  createdAt: Date;
}