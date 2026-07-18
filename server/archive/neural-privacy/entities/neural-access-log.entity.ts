import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AccessAction {
  GRANT = 'grant',
  REVOKE = 'revoke',
  VIEW = 'view',
}

@Entity('neural_access_logs')
export class NeuralAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  accessingUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'accessingUserId' })
  accessingUser?: User;

  @Column({
    type: 'enum',
    enum: AccessAction,
  })
  action: AccessAction;

  @Column({ type: 'text', nullable: true })
  contentType?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @CreateDateColumn()
  createdAt: Date;
}
