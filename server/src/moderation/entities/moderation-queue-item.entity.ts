import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('moderation_queue_items')
export class ModerationQueueItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contentId: string;

  @Column()
  contentType: string;

  @Column('text')
  contentPreview: string;

  @Column()
  authorId: string;

  @Column()
  authorName: string;

  @Column('jsonb')
  analysisResult: any;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status: 'pending' | 'approved' | 'removed' | 'appealed';

  @Column({ nullable: true })
  appealReason?: string;

  @Column({ nullable: true })
  reviewedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}