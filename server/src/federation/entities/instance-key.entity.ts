import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('instance_keys')
export class InstanceKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  privateKey: string;

  @Column({ type: 'text' })
  publicKey: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
