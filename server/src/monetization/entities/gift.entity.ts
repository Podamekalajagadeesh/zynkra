import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  cost: number;
}