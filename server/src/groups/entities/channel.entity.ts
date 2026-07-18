import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Group } from './group.entity';
import { Message } from '../../dms/entities/message.entity';
import { User } from '../../users/entities/user.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['group', 'broadcast'],
    default: 'group',
  })
  type: 'group' | 'broadcast';

  @ManyToOne(() => Group, (group) => group.channels)
  group: Group;

  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];

  @OneToMany(() => ChannelMember, (member) => member.channel)
  members: ChannelMember[];
}

@Entity('channel_members')
export class ChannelMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.members)
  channel: Channel;

  @Column({
    type: 'enum',
    enum: ['admin', 'member'],
    default: 'member',
  })
  role: 'admin' | 'member';
}