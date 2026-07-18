import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Channel } from './channel.entity';
import { GroupMember } from './group-member.entity';
import { Proposal } from './proposal.entity';
import { CommunityChallenge } from './community-challenge.entity';
import { CalendarEvent } from './calendar-event.entity';
import { TodoItem } from './todo-item.entity';
import { GroupPrivacy } from '../enums/group-privacy.enum';
import { VotingSystem } from '../voting-system.enum';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: GroupPrivacy,
    default: GroupPrivacy.PUBLIC,
  })
  privacy: GroupPrivacy;

  @Column({ default: false })
  isDao: boolean;

  @Column({
    type: 'enum',
    enum: VotingSystem,
    default: VotingSystem.ONE_MEMBER_ONE_VOTE,
  })
  votingSystem: VotingSystem;

  @Column({ default: false })
  tokenGated: boolean;

  @Column({ default: false })
  allowAnonymousPosting: boolean;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ nullable: true })
  requiredTokenBalance: string;

  @ManyToOne(() => User, (user) => user.ownedGroups)
  owner: User;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.group)
  members: GroupMember[];

  @OneToMany(() => Channel, (channel) => channel.group)
  channels: Channel[];

  @OneToMany(() => Proposal, (proposal) => proposal.group)
  proposals: Proposal[];

  @OneToMany(() => CommunityChallenge, (challenge) => challenge.group)
  challenges: CommunityChallenge[];

  @OneToMany(() => CalendarEvent, (event) => event.group)
  calendarEvents: CalendarEvent[];

  @OneToMany(() => TodoItem, (todo) => todo.group)
  todoItems: TodoItem[];
}