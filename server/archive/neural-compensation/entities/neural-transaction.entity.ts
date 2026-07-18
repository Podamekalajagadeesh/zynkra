import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('neural_transactions')
export class NeuralTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorId: string;

  @Column()
  consumerId: string;

  @Column('float')
  amount: number;

  @Column({ default: 'NEURO' })
  currency: string;

  @Column()
  contentType: string; // 'thought', 'memory', 'sensory_stream', 'blended_reality'

  @Column({ nullable: true })
  contentId: string;

  @Column('text')
  neuralSignature: string; // Cryptographic proof of neural consent

  @Column({ default: 'completed' })
  status: string;

  @CreateDateColumn()
  timestamp: Date;
}
