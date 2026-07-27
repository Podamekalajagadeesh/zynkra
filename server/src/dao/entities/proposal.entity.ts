import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { DAO } from './dao.entity';
import { Vote } from './vote.entity';

export enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
}

export enum ProposalType {
  COMMUNITY = 'community',
  TREASURY = 'treasury',
  GOVERNANCE = 'governance',
}

// Distinct table name: groups/entities/proposal.entity.ts already owns "proposal".
@Entity('dao_proposal')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ProposalType, default: ProposalType.COMMUNITY })
  type: ProposalType;

  @ManyToOne(() => DAO, (dao) => dao.proposals)
  dao: DAO;

  @OneToMany(() => Vote, (vote) => vote.proposal)
  votes: Vote[];

  @Column({ type: 'enum', enum: ProposalStatus, default: ProposalStatus.ACTIVE })
  status: ProposalStatus;

  /** Number of votes needed to reach quorum */
  @Column({ type: 'int', default: 10 })
  quorum: number;

  /** Percentage needed to pass (0-100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50 })
  passThreshold: number;

  @Column({ type: 'timestamptz', nullable: true })
  votingEndsAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  treasuryAmount: number | null;

  @Column({ default: false })
  isExecuted: boolean;

  @Column({ type: 'int', default: 0 })
  yesVotes: number;

  @Column({ type: 'int', default: 0 })
  noVotes: number;

  @Column({ type: 'int', default: 0 })
  abstainVotes: number;

  @Column({ type: 'int', default: 0 })
  totalVotes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}