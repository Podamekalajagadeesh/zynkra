import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from '../../users/entities/user.entity';

export enum LockdownMode {
  APPROVAL = 'approval', // new joins require admin approval
  MUTE_NEW = 'mute_new', // new members muted for a window
  FULL = 'full', // approval + mute_new
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
