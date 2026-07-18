import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RedactionLevel } from './memory-share-consent.entity';

@Entity('redaction_rules')
export class RedactionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  allowedContexts?: string[]; // e.g., 'family', 'friends', 'public'

  @Column({ type: 'boolean', default: true })
  autoApproveLowSensitivity: boolean;

  @Column({ type: 'boolean', default: false })
  requireReviewForHighSensitivity: boolean;

  @Column({
    type: 'enum',
    enum: RedactionLevel,
    default: RedactionLevel.PARTIAL,
  })
  defaultRedactionLevel: RedactionLevel;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
