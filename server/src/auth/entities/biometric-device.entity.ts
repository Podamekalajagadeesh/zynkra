import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('biometric_devices')
export class BiometricDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  deviceId: string;

  @Column({ type: 'varchar', default: 'Biometric Device' })
  deviceName: string;

  @Column({ type: 'varchar', default: 'face' })
  biometricType: 'fingerprint' | 'face' | 'iris';

  @Column({ type: 'varchar', length: 512 })
  fingerprint: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
