import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('virtual_storefronts')
export class VirtualStorefront {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('json')
  products: string[];

  @Column({ type: 'float', default: 0 })
  virtualLocationX: number;

  @Column({ type: 'float', default: 0 })
  virtualLocationY: number;

  @Column({ type: 'float', default: 0 })
  virtualLocationZ: number;

  @Column({ default: true })
  hasAiPersonalShopper: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
