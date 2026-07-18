import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VirtualProperty } from './virtual-property.entity';
import { User } from '../../users/entities/user.entity';

@Entity('property_shares')
export class PropertyShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VirtualProperty, property => property.shares)
  @JoinColumn({ name: 'propertyId' })
  property: VirtualProperty;

  @Column()
  propertyId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column('float')
  ownershipPercentage: number;

  @Column('float', { default: 0 })
  totalEarned: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
