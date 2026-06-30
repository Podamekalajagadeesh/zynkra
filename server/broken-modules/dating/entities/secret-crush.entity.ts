import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../../src/users/entities/user.entity';

@Entity('secret_crushes')
export class SecretCrush {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  crusher: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  crushed: User;

  @CreateDateColumn()
  createdAt: Date;
}