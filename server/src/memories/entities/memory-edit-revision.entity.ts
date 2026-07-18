import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';

export enum MemoryEditType {
  CONTEXT = 'context',
  ANNOTATION = 'annotation',
  SENSORY_ENHANCEMENT = 'sensory_enhancement',
}

@Entity('memory_edit_revisions')
export class MemoryEditRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memoryId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memoryId' })
  memory?: Post;

  @Column({ nullable: true })
  editorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'editorId' })
  editor?: User;

  @Column({ type: 'enum', enum: MemoryEditType })
  editType: MemoryEditType;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  annotation?: string;

  @Column({ type: 'text', nullable: true })
  sensoryNote?: string;

  @Column({ type: 'jsonb', nullable: true })
  sensoryEnhancements?: {
    visual?: { url: string; type: string }[];
    audio?: { url: string; type: string }[];
    haptic?: { type: string; intensity: number }[];
    olfactory?: { name: string; intensity: number }[];
    gustatory?: { name: string; intensity: number }[];
  };

  @Column({ type: 'text', nullable: true })
  contextNote?: string;

  @CreateDateColumn()
  createdAt: Date;
}