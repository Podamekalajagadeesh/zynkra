import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { DAO } from './dao.entity';
import { Vote } from './vote.entity';

@Entity()
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => DAO, (dao) => dao.proposals)
  dao: DAO;

  @OneToMany(() => Vote, (vote) => vote.proposal)
  votes: Vote[];

  @Column({ default: false })
  isExecuted: boolean;
}