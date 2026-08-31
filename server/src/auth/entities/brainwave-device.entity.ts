import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('brainwave_devices')
export class BrainwaveDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  deviceModel: string;

  @Column()
  firmware: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastUsed: Date | null;

  @Column({ type: 'real', default: 0 })
  accuracy: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  registeredAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}