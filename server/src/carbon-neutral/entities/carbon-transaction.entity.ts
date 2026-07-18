import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CarbonTransactionType {
  EMISSION = 'emission',
  OFFSET = 'offset',
}

@Entity('carbon_transactions')
export class CarbonTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('float')
  amount: number; // in kg CO2 equivalent

  @Column({
    type: 'enum',
    enum: CarbonTransactionType,
  })
  type: CarbonTransactionType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
