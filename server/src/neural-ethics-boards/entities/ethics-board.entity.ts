import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BoardRegion {
  GLOBAL = 'global',
  NORTH_AMERICA = 'north_america',
  EUROPE = 'europe',
  ASIA_PACIFIC = 'asia_pacific',
  LATIN_AMERICA = 'latin_america',
}

@Entity('ethics_boards')
export class EthicsBoard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: BoardRegion,
  })
  region: BoardRegion;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  members?: string[];

  @Column({ type: 'simple-array', nullable: true })
  focusAreas?: string[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
