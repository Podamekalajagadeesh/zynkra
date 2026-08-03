import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TippingService } from './tipping.service';
import { Tip } from './entities/tip.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { ReputationService } from '../reputation/reputation.service';

describe('TippingService', () => {
  let service: TippingService;
  let tipsRepo: jest.Mocked<any>;
  let usersRepo: jest.Mocked<any>;
  let qb: any;

  const userA = {
    id: 'user-a',
    username: 'alice',
    displayName: 'Alice',
    avatar: 'https://cdn.example/alice.png',
  };
  const userB = {
    id: 'user-b',
    username: 'bob',
    displayName: 'Bob',
    avatar: null,
  };

  beforeEach(async () => {
    qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TippingService,
        {
          provide: getRepositoryToken(Tip),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ReputationService,
          useValue: {
            addReputation: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<TippingService>(TippingService);
    tipsRepo = module.get(getRepositoryToken(Tip));
    usersRepo = module.get(getRepositoryToken(User));
  });

  describe('getLeaderboard', () => {
    it('returns entries ranked by total tips descending', async () => {
      qb.getRawMany.mockResolvedValue([
        { toId: 'user-a', total: '120', tipCount: '3' },
        { toId: 'user-b', total: '50', tipCount: '1' },
      ]);
      usersRepo.find.mockResolvedValue([userA, userB]);

      const result = await service.getLeaderboard('all');

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].user.username).toBe('alice');
      expect(result[0].totalAmount).toBe(120);
      expect(result[0].tipCount).toBe(3);
      expect(result[1].user.username).toBe('bob');
      expect(tipsRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('applies a since-window filter for weekly period', async () => {
      qb.getRawMany.mockResolvedValue([]);
      usersRepo.find.mockResolvedValue([]);

      await service.getLeaderboard('weekly');

      expect(qb.where).toHaveBeenCalled();
      const since = qb.where.mock.calls[0][1].since as Date;
      expect(since.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('returns empty array when no tips exist', async () => {
      qb.getRawMany.mockResolvedValue([]);
      usersRepo.find.mockResolvedValue([]);

      const result = await service.getLeaderboard('monthly');
      expect(result).toEqual([]);
    });

    it('clamps the limit between 1 and 100', async () => {
      qb.getRawMany.mockResolvedValue([]);
      usersRepo.find.mockResolvedValue([]);

      await service.getLeaderboard('all', 9999);
      expect(qb.limit).toHaveBeenCalledWith(100);
    });
  });
});
