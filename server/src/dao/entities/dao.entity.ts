import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { Proposal } from './proposal.entity';

@Entity()
export class DAO {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Group)
  @JoinColumn()
  group: Group;

  @OneToMany(() => Proposal, (proposal) => proposal.dao)
  proposals: Proposal[];
}