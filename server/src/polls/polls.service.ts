import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from './entities/poll.entity';
import { PollOption } from './entities/poll-option.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private readonly pollsRepository: Repository<Poll>,
    @InjectRepository(PollOption)
    private readonly pollOptionsRepository: Repository<PollOption>,
    private readonly usersService: UsersService,
  ) {}

  async vote(pollOptionId: string, userId: string): Promise<Poll> {
    const user = await this.usersService.findOneById(userId, ['votedOptions']);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const pollOption = await this.pollOptionsRepository.findOne({
        where: { id: pollOptionId },
        relations: ['poll', 'poll.options', 'votes']
    });
    if (!pollOption) {
      throw new NotFoundException('Poll option not found');
    }

    const poll = await this.pollsRepository.findOne({
        where: { id: pollOption.poll.id },
        relations: ['options', 'options.votes']
    });
    if (!poll) {
        throw new NotFoundException('Poll not found');
    }

    // Check if the user has already voted on this poll
    const hasVoted = poll.options.some(option => option.votes.some(vote => vote.id === user.id));
    if (hasVoted) {
        throw new UnauthorizedException('User has already voted on this poll');
    }

    pollOption.votes.push(user);
    pollOption.voteCount += 1;
    await this.pollOptionsRepository.save(pollOption);

    return this.pollsRepository.findOne({
        where: { id: poll.id },
        relations: ['options', 'options.votes']
    });
  }
}