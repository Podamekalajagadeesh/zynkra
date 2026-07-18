import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('page_views')
export class PageView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  viewerId: string;

  @Column({ nullable: true })
  userId: string; // For profile views

  @Column({ nullable: true })
  creatorId: string; // For post views (creator of the post)

  @Column({ nullable: true })
  postId: string; // For post views

  @Column()
  pageType: 'profile' | 'post' | 'reel' | 'story';

  @CreateDateColumn({ type: 'timestamp with time zone' })
  viewedAt: Date;
}