import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sticker } from './sticker.entity';

@Entity()
export class UserSticker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.userStickers)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  stickerId: string;

  @ManyToOne(() => Sticker, sticker => sticker.userStickers)
  @JoinColumn({ name: 'stickerId' })
  sticker: Sticker;

  @Column('decimal', { precision: 10, scale: 2 })
  purchasePrice: number;

  @CreateDateColumn()
  purchasedAt: Date;
}