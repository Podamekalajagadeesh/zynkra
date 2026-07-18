import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from '../../users/entities/user.entity';

@Entity('todo_items')
export class TodoItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  dueDate: Date;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  assignee: User;

  @ManyToOne(() => Group, (group) => group.id)
  group: Group;

  @ManyToOne(() => User, (user) => user.id)
  creator: User;
}