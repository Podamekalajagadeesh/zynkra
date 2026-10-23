import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Group } from './group.entity';
import { User } from '../../users/entities/user.entity';

export enum LockdownMode {
  // Joins stay blocked until an admin approves — the approval workflow itself
  // (pending membership state + approve/reject UI) is backlog; today this mode
  // behaves exactly like FULL. Kept in the enum so existing rows stay valid.
  APPROVAL = 'approval',
  // Joins allowed; members who joined during the window cannot post for
  // `newMemberMuteHours` (enforced in GroupsService.addMessage).
  MUTE_NEW = 'mute_new',
  // Hard lockdown: all joins rejected for the lockdown duration.
  FULL = 'full',
}

@Entity('group_lockdowns')
export class GroupLockdown {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToOne(() => User)
  createdBy: User;

  @Column({
    type: 'enum',
    enum: LockdownMode,
    default: LockdownMode.APPROVAL,
  })
  mode: LockdownMode;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  activeSince: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  activeUntil: Date | null;

  @Column({ type: 'int', default: 24 })
  newMemberMuteHours: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
