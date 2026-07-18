import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PageConversation } from './page-conversation.entity';

@Entity()
export class PageMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(
    () => PageConversation,
    (conversation) => conversation.messages,
  )
  conversation: PageConversation;
}