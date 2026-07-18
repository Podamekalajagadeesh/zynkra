import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DaoService } from './dao.service';
import { CreateDaoDto } from './dto/create-dao.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { VoteDto } from './dto/vote.dto';

@Controller('dao')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createDao(@Body() createDaoDto: CreateDaoDto) {
    return this.daoService.createDao(createDaoDto);
  }

  @Post(':daoId/proposals')
  @UseGuards(JwtAuthGuard)
  createProposal(@Param('daoId') daoId: string, @Body() createProposalDto: CreateProposalDto) {
    return this.daoService.createProposal(daoId, createProposalDto);
  }

  @Post('proposals/:proposalId/vote')
  @UseGuards(JwtAuthGuard)
  vote(@Param('proposalId') proposalId: string, @Body() voteDto: VoteDto) {
    return this.daoService.vote(proposalId, voteDto);
  }

  @Get(':daoId/proposals')
  getProposals(@Param('daoId') daoId: string) {
    return this.daoService.getProposals(daoId);
  }

  @Get('proposals/:proposalId')
  getProposal(@Param('proposalId') proposalId: string) {
    return this.daoService.getProposal(proposalId);
  }
}