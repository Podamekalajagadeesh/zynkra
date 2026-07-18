import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('memory_projects')
export class MemoryProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  topic: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'simple-array', nullable: true })
  memoryIds: string[];

  @Column({ type: 'simple-array', nullable: true })
  contributorIds: string[];

  @Column({ type: 'simple-array', nullable: true })
  contributorNames: string[];

  @Column({ type: 'varchar', length: 20, default: 'public' })
  visibility: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ type: 'uuid', nullable: true })
  creatorId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
