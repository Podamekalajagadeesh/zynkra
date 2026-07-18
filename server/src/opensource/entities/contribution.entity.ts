import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ContributionStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MERGED = 'merged'
}

export enum ContributionType {
  FEATURE = 'feature',
  BUGFIX = 'bugfix',
  DOCUMENTATION = 'documentation',
  UI_IMPROVEMENT = 'ui_improvement',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

@Entity('contributions')
export class Contribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: ContributionType,
    default: ContributionType.FEATURE
  })
  type: ContributionType;

  @Column({
    type: 'varchar',
    enum: ContributionStatus,
    default: ContributionStatus.PENDING
  })
  status: ContributionStatus;

  @Column('simple-array', { nullable: true })
  affectedFiles: string[];

  @Column('text', { nullable: true })
  codeChanges?: string;

  @Column({ nullable: true })
  pullRequestUrl?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  reviewer?: User;

  @Column({ nullable: true })
  reviewerId?: string;

  @Column({ nullable: true })
  reviewComments?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  mergedAt?: Date;
}