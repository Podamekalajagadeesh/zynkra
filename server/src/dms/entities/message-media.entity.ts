import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_media')
export class MessageMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  @Column({ type: 'varchar', length: 20 })
  type: 'image' | 'video' | 'audio';

  // Commented out - Message entity doesn't have a media property
  // @ManyToOne(() => Message, (message) => message.media)
  // message: Message;
}