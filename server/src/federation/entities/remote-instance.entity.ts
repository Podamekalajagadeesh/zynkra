import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RemoteUser } from './remote-user.entity';

@Entity('federated_instances')
export class RemoteInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  domain: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  baseUrl: string;

  @Column({ nullable: true })
  software: string;

  @Column({ nullable: true })
  version: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ nullable: true })
  lastSyncAt: Date;

  @Column({ nullable: true })
  actorCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RemoteUser, (remoteUser) => remoteUser.instance)
  remoteUsers: RemoteUser[];
}