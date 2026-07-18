import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DataPurpose {
  ACCOUNT = 'account',
  CONTENT = 'content',
  COMMUNICATION = 'communication',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
}

@Entity('data_collection_logs')
export class DataCollectionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'simple-array', nullable: true })
  dataTypes?: string[];

  @Column({
    type: 'enum',
    enum: DataPurpose,
  })
  purpose: DataPurpose;

  @Column({ type: 'boolean', default: true })
  necessary: boolean;

  @Column({ type: 'boolean', default: true })
  minimal: boolean;

  @Column({ type: 'json', nullable: true })
  collectionDetails?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
