import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('push_subscriptions')
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ unique: true })
  endpoint: string;

  @Column('jsonb')
  keys: {
    p256dh: string;
    auth: string;
  };

  @CreateDateColumn()
  createdAt: Date;
}
