import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

@Entity()
export class MessageReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Message)
  message: Message;

  @CreateDateColumn()
  readAt: Date;
}