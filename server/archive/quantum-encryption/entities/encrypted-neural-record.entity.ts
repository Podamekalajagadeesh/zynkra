import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuantumKey } from './quantum-key.entity';

@Entity('encrypted_neural_records')
export class EncryptedNeuralRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  keyId?: string;

  @ManyToOne(() => QuantumKey, { nullable: true })
  @JoinColumn({ name: 'keyId' })
  quantumKey?: QuantumKey;

  @Column({ type: 'text' })
  encryptedData: string; // Quantum-encrypted neural data

  @Column({ type: 'text' })
  dataHash: string; // Hash for integrity verification

  @Column()
  encryptionAlgorithm: string; // e.g., 'CRYSTALS-Kyber-768'

  @Column({ type: 'simple-array', nullable: true })
  accessControlList?: string[]; // User IDs allowed to decrypt

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Record type, timestamp, etc.

  @CreateDateColumn()
  createdAt: Date;
}
