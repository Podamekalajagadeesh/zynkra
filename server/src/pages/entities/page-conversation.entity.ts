import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Page } from './page.entity';
import { User } from '../../users/entities/user.entity';
import { PageMessage } from './page-message.entity';

@Entity()
export class PageConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Page, (page) => page.conversations)
  page: Page;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @OneToMany(() => PageMessage, (message) => message.conversation)
  messages: PageMessage[];
}