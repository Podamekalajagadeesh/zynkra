import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DigitalAsset } from '../../digital-assets/entities/digital-asset.entity';

export enum InheritanceStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
}

@Entity('digital_inheritances')
export class DigitalInheritance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'ownerId' })
  owner: Relation<User>;

  @Column({ type: 'uuid', nullable: true })
  beneficiaryId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'beneficiaryId' })
  beneficiary: Relation<User>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  includedAssets: string[]; // Array of digital asset IDs

  @Column({ type: 'jsonb', default: () => "'[]'" })
  includedMemories: string[]; // Array of memory IDs

  @Column({ type: 'jsonb', default: () => "'[]'" })
  includedSocialConnections: string[]; // Array of user IDs to transfer connections to

  @Column({ type: 'text', nullable: true })
  lastWillAndTestament: string;

  @Column({
    type: 'enum',
    enum: InheritanceStatus,
    default: InheritanceStatus.DRAFT,
  })
  status: InheritanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledActivationDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
