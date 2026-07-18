import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ConsentStatus {
  PENDING = 'pending',
  GRANTED = 'granted',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum RedactionLevel {
  NONE = 'none',
  PARTIAL = 'partial',
  FULL = 'full',
}

@Entity('memory_share_consents')
export class MemoryShareConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memoryId: string;

  @Column()
  requesterId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column()
  recipientId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ type: 'simple-array', nullable: true })
  includedUserIds?: string[]; // Users whose data is in the memory

  @Column({ type: 'json', nullable: true })
  requestedRedactionLevels?: Record<string, RedactionLevel>; // user ID -> redaction level

  @Column({
    type: 'enum',
    enum: ConsentStatus,
    default: ConsentStatus.PENDING,
  })
  status: ConsentStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  requestMessage?: string;

  @Column({ type: 'text', nullable: true })
  responseMessage?: string;

  @Column({ type: 'json', nullable: true })
  grantedRedactionLevels?: Record<string, RedactionLevel>; // final user ID -> redaction level

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
