import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  TIMELINE_REVIEW = 'timeline_review',
  LOGIN_ALERT = 'login_alert',
  REPLY = 'reply',
  COMMENT = 'comment',
  MENTION = 'mention',
  LIKE = 'like',
  FOLLOW = 'follow',
  SHARE = 'share',
  POKE = 'poke',
  BEREAL_POSTED = 'bereal_posted',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column('jsonb')
  data: any;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}