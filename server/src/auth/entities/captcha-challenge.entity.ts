import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * A pending arithmetic-CAPTCHA challenge.
 *
 * This was an in-process `Map`, so a challenge issued on one instance could not
 * be verified on another, and every challenge was lost on restart.
 */
@Entity('captcha_challenges')
@Index('idx_captcha_challenges_expires_at', ['expiresAt'])
export class CaptchaChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Null for pre-authentication challenges (signup, signin). */
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'int' })
  answer: number;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
