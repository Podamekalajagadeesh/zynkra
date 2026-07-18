import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum HarmType {
  SEIZURE_RISK = 'seizure_risk',
  EMOTIONAL_DISTRESS = 'emotional_distress',
  OVERSTIMULATION = 'overstimulation',
  UNKNOWN = 'unknown',
}

export enum ActionTaken {
  BLOCKED = 'blocked',
  MODIFIED = 'modified',
  WARNED = 'warned',
  NOTHING = 'nothing',
}

@Entity('harm_prevention_logs')
export class HarmPreventionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column()
  contentId: string;

  @Column({
    type: 'enum',
    enum: HarmType,
  })
  harmType: HarmType;

  @Column({
    type: 'enum',
    enum: ActionTaken,
  })
  action: ActionTaken;

  @Column({ type: 'float' })
  riskScore: number;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'json', nullable: true })
  contentMetadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
