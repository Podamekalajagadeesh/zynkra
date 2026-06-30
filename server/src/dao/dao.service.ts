import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DAO } from './entities/dao.entity';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { CreateDaoDto } from './dto/create-dao.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { VoteDto } from './dto/vote.dto';

@Injectable()
export class DaoService {
  constructor(
    @InjectRepository(DAO)
    private readonly daoRepository: Repository<DAO>,
    @InjectRepository(Proposal)
    private readonly proposalRepository: Repository<Proposal>,
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createDao(createDaoDto: CreateDaoDto): Promise<DAO> {
    const group = await this.groupRepository.findOne({ where: { id: createDaoDto.groupId } });
    const dao = this.daoRepository.create({ group });
    return this.daoRepository.save(dao);
  }

  async createProposal(daoId: string, createProposalDto: CreateProposalDto): Promise<Proposal> {
    const dao = await this.daoRepository.findOne({ where: { id: daoId } });
    const proposal = this.proposalRepository.create({ ...createProposalDto, dao });
    return this.proposalRepository.save(proposal);
  }

  async vote(proposalId: string, voteDto: VoteDto): Promise<Vote> {
    const proposal = await this.proposalRepository.findOne({ where: { id: proposalId } });
    const voter = await this.userRepository.findOne({ where: { id: voteDto.voterId } });
    
    let vote = await this.voteRepository.findOne({ where: { proposal: { id: proposalId }, voter: { id: voteDto.voterId } } });

    if (vote) {
      vote.support = voteDto.support;
    } else {
      vote = this.voteRepository.create({ proposal, voter, support: voteDto.support });
    }

    return this.voteRepository.save(vote);
  }

  async getProposals(daoId: string): Promise<Proposal[]> {
    return this.proposalRepository.find({ where: { dao: { id: daoId } }, relations: ['votes', 'votes.voter'] });
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    return this.proposalRepository.findOne({ where: { id: proposalId }, relations: ['votes', 'votes.voter'] });
  }
}