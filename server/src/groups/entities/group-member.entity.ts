import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';
import { GroupRole } from '../group-role.enum';

@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.groupMemberships)
  user: User;

  @ManyToOne(() => Group, (group) => group.members)
  group: Group;

  @Column({
    type: 'enum',
    enum: GroupRole,
    default: GroupRole.MEMBER,
  })
  role: GroupRole;
}