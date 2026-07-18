import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class SignedPreKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column()
  keyId: number;

  @Column({ type: 'text' })
  publicKey: string;

  @Column({ type: 'text' })
  signature: string;
}