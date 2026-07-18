import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum KeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('quantum_keys')
export class QuantumKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  keyId: string; // Unique identifier for the quantum key

  @Column({ type: 'text' })
  publicKey: string; // Post-quantum public key

  @Column({ type: 'text', nullable: true })
  encryptedPrivateKey?: string; // Encrypted private key stored securely

  @Column({
    type: 'enum',
    enum: KeyStatus,
    default: KeyStatus.ACTIVE,
  })
  status: KeyStatus;

  @Column({ type: 'simple-array', nullable: true })
  keyAlgorithms?: string[]; // e.g., 'CRYSTALS-Kyber', 'CRYSTALS-Dilithium'

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
