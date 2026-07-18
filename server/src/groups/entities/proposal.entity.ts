import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Group } from './group.entity';
import { User } from '../../users/entities/user.entity';
import { Vote } from './vote.entity';

export enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity()
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, (group) => group.proposals)
  group: Group;

  @ManyToOne(() => User)
  creator: User;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.ACTIVE,
  })
  status: ProposalStatus;

  @OneToMany(() => Vote, (vote) => vote.proposal)
  votes: Vote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}