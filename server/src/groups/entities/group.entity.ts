import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
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
// The `groups` table also carries four columns this entity deliberately does
// not map: `tokenGated`, `contractAddress`, `requiredTokenBalance` (written by
// no code path in this repo — vestigial from an earlier token-gating sketch)
// and `searchVector` (unused; discovery scans `name` directly). They stay in
// the DB because dropping them would be a destructive migration for columns
// that are merely dead, not wrong.
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
  allowAnonymousPosting: boolean;

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
