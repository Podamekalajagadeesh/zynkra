import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DAO } from './entities/dao.entity';
import { Proposal, ProposalStatus, ProposalType } from './entities/proposal.entity';
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
    if (!group) throw new NotFoundException('Group not found');
    const dao = this.daoRepository.create({ group });
    return this.daoRepository.save(dao);
  }

  async createProposal(daoId: string, createProposalDto: CreateProposalDto): Promise<Proposal> {
    const dao = await this.daoRepository.findOne({ where: { id: daoId } });
    if (!dao) throw new NotFoundException('DAO not found');

    const slug = createProposalDto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
    const votingDays = (createProposalDto as any).votingDays || 7;
    const votingEndsAt = new Date(Date.now() + votingDays * 24 * 60 * 60 * 1000);

    const proposal = this.proposalRepository.create({
      ...createProposalDto,
      slug,
      dao,
      status: ProposalStatus.ACTIVE,
      votingEndsAt,
      quorum: (createProposalDto as any).quorum || 10,
      passThreshold: (createProposalDto as any).passThreshold || 50,
      treasuryAmount: (createProposalDto as any).treasuryAmount || null,
    });

    return this.proposalRepository.save(proposal);
  }

  async vote(proposalId: string, voteDto: VoteDto): Promise<Vote> {
    const proposal = await this.proposalRepository.findOne({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== ProposalStatus.ACTIVE) throw new BadRequestException('Proposal is not active');
    if (proposal.votingEndsAt && new Date() > proposal.votingEndsAt) {
      proposal.status = ProposalStatus.EXPIRED;
      await this.proposalRepository.save(proposal);
      throw new BadRequestException('Voting period has ended');
    }

    const voter = await this.userRepository.findOne({ where: { id: voteDto.voterId } });
    if (!voter) throw new NotFoundException('Voter not found');

    // Check existing vote
    let vote = await this.voteRepository.findOne({
      where: { proposal: { id: proposalId }, voter: { id: voteDto.voterId } },
    });

    if (vote) {
      // Update existing vote
      const oldChoice = vote.support;
      vote.support = voteDto.support;
      await this.voteRepository.save(vote);

      // Recalculate counts
      this.recalculateProposalVotes(proposal);
      return vote;
    }

    vote = this.voteRepository.create({ proposal, voter, support: voteDto.support });
    const savedVote = await this.voteRepository.save(vote);

    // Update proposal vote counts
    this.recalculateProposalVotes(proposal);

    return savedVote;
  }

  private recalculateProposalVotes(proposal: Proposal): void {
    // These will be calculated from actual votes
    proposal.totalVotes = (proposal as any).votes?.length || 0;
    proposal.status = proposal.status; // ensure type safety
    this.proposalRepository.save(proposal);
  }

  async getProposals(daoId: string): Promise<Proposal[]> {
    return this.proposalRepository.find({
      where: { dao: { id: daoId } },
      relations: ['votes', 'votes.voter'],
      order: { createdAt: 'DESC' },
    });
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
      relations: ['votes', 'votes.voter', 'dao'],
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async executeProposal(proposalId: string): Promise<Proposal> {
    const proposal = await this.getProposal(proposalId);

    // Check if passed
    if (proposal.status !== ProposalStatus.PASSED) {
      // Check if can be marked as passed
      const votes = proposal.votes || [];
      const yesCount = votes.filter(v => v.support).length;
      const noCount = votes.filter(v => !v.support).length;
      const total = yesCount + noCount;

      if (total < proposal.quorum) {
        throw new BadRequestException(`Quorum not reached (${total}/${proposal.quorum})`);
      }

      const passPercentage = (yesCount / total) * 100;
      if (passPercentage < Number(proposal.passThreshold)) {
        throw new BadRequestException(`Did not reach ${proposal.passThreshold}% threshold`);
      }

      proposal.status = ProposalStatus.PASSED;
    }

    proposal.isExecuted = true;
    proposal.status = ProposalStatus.EXECUTED;
    return this.proposalRepository.save(proposal);
  }

  async getDaoStats(daoId: string): Promise<{
    totalProposals: number;
    activeProposals: number;
    passedProposals: number;
    executedProposals: number;
    totalVotes: number;
  }> {
    const [totalProposals, activeProposals, passedProposals, executedProposals, totalVotes] = await Promise.all([
      this.proposalRepository.count({ where: { dao: { id: daoId } } }),
      this.proposalRepository.count({ where: { dao: { id: daoId }, status: ProposalStatus.ACTIVE } }),
      this.proposalRepository.count({ where: { dao: { id: daoId }, status: ProposalStatus.PASSED } }),
      this.proposalRepository.count({ where: { dao: { id: daoId }, status: ProposalStatus.EXECUTED } }),
      this.voteRepository.count({ where: { proposal: { dao: { id: daoId } } } }),
    ]);

    return { totalProposals, activeProposals, passedProposals, executedProposals, totalVotes };
  }
}
