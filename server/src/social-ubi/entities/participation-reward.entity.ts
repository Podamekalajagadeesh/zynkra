import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ParticipationType {
  CONTENT_CREATION = 'content_creation',
  MODERATION = 'moderation',
  COMMENT = 'comment',
  LIKE = 'like',
  SHARE = 'share',
  GROUP_ENGAGEMENT = 'group_engagement',
}

@Entity('participation_rewards')
export class ParticipationReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('float')
  amount: number;

  @Column({
    type: 'enum',
    enum: ParticipationType,
  })
  type: ParticipationType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
