
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Fundraiser } from '../../fundraisers/entities/fundraiser.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('nonprofits')
export class Nonprofit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column('text', { nullable: true })
  missionStatement: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @ManyToOne(() => User, (user) => user.nonprofits)
  user: User;

  @OneToMany(() => Fundraiser, (fundraiser) => fundraiser.nonprofit)
  fundraisers: Fundraiser[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}