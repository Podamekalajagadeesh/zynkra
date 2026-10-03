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
 * A pending biometric device-verification challenge.
 *
 * This was an in-process `Map` inside `BiometricAuthService`, which meant
 * challenges were lost on restart and invisible to every instance but the one
 * that issued them — so a verification started on instance A and finished on
 * instance B always failed.
 */
@Entity('biometric_challenges')
@Index(['expiresAt'])
export class BiometricChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  deviceId: string;

  @Column({ type: 'varchar', length: 128 })
  challenge: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
