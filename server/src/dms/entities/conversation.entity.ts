import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  Column,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';
import { ConversationType } from '../conversation-type.enum';
import { Page } from '../../pages/entities/page.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.ONE_TO_ONE,
  })
  type: ConversationType;

  @Column({ nullable: true })
  name: string;

  @ManyToOne(() => User)
  owner: User;

  @ManyToMany(() => User, (user) => user.conversations)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @Column({ default: false })
  vanishMode: boolean;

  /** Disappearing messages: TTL in seconds for new messages (null = off). */
  @Column({ type: 'int', nullable: true })
  messageTtlSeconds: number | null;

  @Column({ default: false })
  isEncrypted: boolean;

  @ManyToOne(() => Page, { nullable: true })
  page: Page;

  /** Modmail: the group whose moderation inbox this thread belongs to. */
  @ManyToOne(() => Group, { nullable: true })
  group: Group;

  /** Modmail: the member the mods are talking to (internal notes are hidden from them). */
  @ManyToOne(() => User, { nullable: true })
  modmailRecipient: User;
}