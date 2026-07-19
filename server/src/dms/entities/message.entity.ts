import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';
import { Channel } from '../../groups/entities/channel.entity';
import { MessageReaction } from './message-reaction.entity';
import { MessageReceipt } from './message-receipt.entity';
import { Page } from '../../pages/entities/page.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  senderPublicKey: string;

  @Column({
    type: 'enum',
    enum: ['text', 'image', 'video', 'audio'],
    default: 'text',
  })
  mediaType: 'text' | 'image' | 'video' | 'audio';

  @Column({ type: 'text', nullable: true })
  mediaUrl: string;

  /** Media attachments in the shape the client renders (images/videos/audio). */
  @Column({ type: 'jsonb', nullable: true })
  media: { url: string; type: 'image' | 'video' | 'audio' }[] | null;

  /** Disappearing messages: when set, the message is hidden and swept after this time. */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  /** Modmail internal note: only visible to moderators, never to the recipient. */
  @Column({ default: false })
  isInternal: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  sender: User;

  @ManyToOne(() => Page, { nullable: true })
  pageSender: Page;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    nullable: true,
  })
  conversation: Conversation;

  @ManyToOne(() => Channel, (channel) => channel.messages, { nullable: true })
  channel: Channel;

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];

  @ManyToOne(() => Message, { nullable: true })
  replyTo: Message;

  @ManyToOne(() => Message, { nullable: true })
  forwardedFrom: Message;

  @OneToMany(() => MessageReceipt, (receipt) => receipt.message)
  readBy: MessageReceipt[];
}