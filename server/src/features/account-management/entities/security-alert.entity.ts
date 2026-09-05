import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { ManyToOne } from 'typeorm';

@Entity('security_alerts')
@Index(['userId', 'resolved', 'createdAt'])
export class SecurityAlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 16, default: 'medium' })
  severity: string;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
