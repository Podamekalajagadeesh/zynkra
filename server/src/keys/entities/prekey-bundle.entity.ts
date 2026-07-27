import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('prekey_bundles')
export class PreKeyBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  registrationId: number;

  @Column({ type: 'int' })
  deviceId: number;

  @Column('text')
  identityKey: string;

  @Column('text')
  signedPreKeyPublic: string;

  @Column('text')
  signedPreKeySignature: string;

  @Column('text', { nullable: true })
  oneTimePreKeyPublic: string | null;

  @Column({ type: 'int', nullable: true })
  oneTimePreKeyId: number | null;

  @Column({ type: 'int', nullable: true })
  signedPreKeyId: number | null;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
