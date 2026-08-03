import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Thread } from './thread.entity';
import { User } from '../../users/entities/user.entity';

@Entity('thread_messages')
export class ThreadMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Thread, (thread) => thread.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread: Thread;

  @Column({ name: 'thread_id' })
  threadId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => ThreadMessage, (message) => message.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_message_id' })
  parentMessage: ThreadMessage | null;

  @Column({ name: 'parent_message_id', type: 'uuid', nullable: true })
  parentMessageId: string | null;

  @OneToMany(() => ThreadMessage, (message) => message.parentMessage)
  replies: ThreadMessage[];

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
