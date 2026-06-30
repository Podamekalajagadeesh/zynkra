import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ModerationQueueItemEntity } from './moderation-queue-item.entity';

@Entity('content_flags')
export class ContentFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  queueItemId: string;

  @Column({
    type: 'varchar',
    length: 50
  })
  type: 'harmful' | 'misinformation' | 'hate_speech' | 'violence' | 'adult_content' | 'spam' | 'fraud' | 'deepfake' | 'synthetic_content';

  @Column('text')
  description: string;

  @Column('float')
  confidence: number;

  @Column('jsonb', { nullable: true })
  deepfakeAnalysis?: {
    faceDetectionConfidence: number;
    manipulationScore: number;
    tamperedRegions?: string[];
    aiModelUsed: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ModerationQueueItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'queueItemId' })
  queueItem: ModerationQueueItemEntity;
}