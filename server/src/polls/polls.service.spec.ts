import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PollsService } from './polls.service';
import { Poll } from './entities/poll.entity';
import { PollOption } from './entities/poll-option.entity';
import { UsersService } from '../users/users.service';

function makeUser(overrides: any = {}) {
  return { id: 'user-1', votedOptions: [], ...overrides };
}

function makePollOption(overrides: any = {}) {
  return { id: 'opt-1', text: 'Option A', voteCount: 0, votes: [], poll: { id: 'poll-1' }, ...overrides };
}

function makePoll(overrides: any = {}) {
  return { id: 'poll-1', question: 'Fav color?', options: [], ...overrides };
}

describe('PollsService', () => {
  let service: PollsService;
  let pollRepo: jest.Mocked<Repository<Poll>>;
  let pollOptionRepo: jest.Mocked<Repository<PollOption>>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        { provide: getRepositoryToken(Poll), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(PollOption), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn() } },
        { provide: UsersService, useValue: { findOneById: jest.fn() } },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
    pollRepo = module.get(getRepositoryToken(Poll));
    pollOptionRepo = module.get(getRepositoryToken(PollOption));
    usersService = module.get(UsersService);
  });

  describe('vote', () => {
    it('adds a vote to a poll option', async () => {
      const user = makeUser();
      const pollOption = makePollOption();
      const poll = makePoll({ options: [pollOption] });

      usersService.findOneById.mockResolvedValue(user as any);
      pollOptionRepo.findOne.mockResolvedValue(pollOption as any);
      pollRepo.findOne.mockResolvedValue(poll as any);
      pollOptionRepo.save.mockResolvedValue(pollOption as any);
      pollRepo.save.mockResolvedValue(poll as any);

      const result = await service.vote('opt-1', 'user-1');
      expect(pollOption.votes).toHaveLength(1);
      expect(pollOption.voteCount).toBe(1);
      expect(pollOptionRepo.save).toHaveBeenCalled();
    });

    it('throws when user not found', async () => {
      usersService.findOneById.mockResolvedValue(null);
      await expect(service.vote('opt-1', 'bad-id')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when poll option not found', async () => {
      usersService.findOneById.mockResolvedValue(makeUser() as any);
      pollOptionRepo.findOne.mockResolvedValue(null);
      await expect(service.vote('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws when user already voted', async () => {
      const user = makeUser({ id: 'user-1' });
      const existingVotes = [{ id: 'user-1' }];
      const pollOption = makePollOption();
      const poll = makePoll({ options: [{ ...pollOption, votes: existingVotes }] });

      usersService.findOneById.mockResolvedValue(user as any);
      pollOptionRepo.findOne.mockResolvedValue(pollOption as any);
      pollRepo.findOne.mockResolvedValue(poll as any);

      await expect(service.vote('opt-1', 'user-1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when poll not found', async () => {
      const user = makeUser();
      const pollOption = makePollOption();

      usersService.findOneById.mockResolvedValue(user as any);
      pollOptionRepo.findOne.mockResolvedValue(pollOption as any);
      // First call (for pollOption) returns the option, second call (for poll) returns null
      pollRepo.findOne
        .mockResolvedValueOnce(null as any)
        .mockResolvedValueOnce(null as any);

      await expect(service.vote('opt-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
