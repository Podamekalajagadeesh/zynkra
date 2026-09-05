import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

export enum AccountProfileType {
  PERSONAL = 'personal',
  CREATOR = 'creator',
  BUSINESS = 'business',
  ORGANIZATION = 'organization',
}

@Entity('account_profiles')
@Index(['accountId', 'isPrimary'])
export class AccountProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  accountId: string;

  @Column({ type: 'varchar', length: 80 })
  label: string;

  @Column({ type: 'enum', enum: AccountProfileType, default: AccountProfileType.PERSONAL })
  accountType: AccountProfileType;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
