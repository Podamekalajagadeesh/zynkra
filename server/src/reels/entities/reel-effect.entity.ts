import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reel_effects')
export class ReelEffect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  thumbnailUrl: string;
}