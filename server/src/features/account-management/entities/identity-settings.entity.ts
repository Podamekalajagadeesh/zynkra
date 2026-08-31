import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

@Entity('identity_settings')
@Index(['userId'])
export class IdentitySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'boolean', default: false })
  publicProfile: boolean;

  @Column({ type: 'boolean', default: false })
  creatorMode: boolean;

  @Column({ type: 'boolean', default: false })
  businessMode: boolean;

  @Column({ type: 'varchar', nullable: true })
  businessName: string | null;

  @Column({ type: 'varchar', nullable: true })
  businessRegistrationNumber: string | null;

  @Column({ type: 'text', nullable: true })
  businessAddress: string | null;

  @Column({ type: 'boolean', default: false })
  ageVerified: boolean;

  @Column({ type: 'date', nullable: true })
  verifiedBirthDate: string | null;

  @Column({ type: 'timestamp', nullable: true })
  ageVerificationDate: Date | null;

  @Column({ type: 'boolean', default: false })
  enhancedSecurity: boolean;

  @Column({ type: 'boolean', default: false })
  verificationRequired: boolean;

  @Column({ type: 'varchar', nullable: true })
  organizationName: string | null;

  @Column({ type: 'varchar', nullable: true })
  organizationRegistrationNumber: string | null;

  @Column({ type: 'text', nullable: true })
  organizationWebsite: string | null;

  @Column({ type: 'simple-json', nullable: true })
  customFields: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
