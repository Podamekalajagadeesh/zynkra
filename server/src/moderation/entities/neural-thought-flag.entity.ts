import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('neural_thought_flags')
export class NeuralThoughtFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  contentId: string;

  @Column()
  contentType: 'thought_post' | 'telepathic_message' | 'memory_share';

  @Column('text')
  rawThoughtContent: string;

  @Column('jsonb', { nullable: true })
  neuralSignalData?: {
    brainwavePatterns: number[];
    emotionalIntensity: number;
    contextualCues: string[];
    temporalMarkers: string;
  };

  @Column()
  isHarmful: boolean;

  @Column('text', { array: true, default: [] })
  harmfulCategories: string[];

  @Column()
  confidenceScore: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'blocked' | 'approved' | 'appealed';

  @Column({ nullable: true })
  appealReason?: string;

  @Column({ nullable: true })
  moderatedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'moderatedById' })
  moderatedBy?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}