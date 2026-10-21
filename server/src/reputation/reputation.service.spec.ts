import { ReputationService } from './reputation.service';
import { ReputationEvent } from './reputation.enum';

describe('ReputationService', () => {
  let reputationRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let reputationLogRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let service: ReputationService;

  beforeEach(() => {
    reputationRepository = {
      findOne: jest.fn(),
      create: jest.fn((input: object) => ({ ...input })),
      save: jest.fn(async (row: { id?: string }) => {
        if (!row.id) row.id = 'rep-1';
        return row;
      }),
    };
    reputationLogRepository = {
      create: jest.fn((input: unknown) => input),
      save: jest.fn().mockResolvedValue(undefined),
    };
    service = new ReputationService(
      reputationRepository as never,
      reputationLogRepository as never
    );
  });

  const user = { id: 'u1' } as never;

  it('returns the stored reputation with logs for a user', async () => {
    const stored = { id: 'rep-1', score: 12 };
    reputationRepository.findOne.mockResolvedValue(stored);
    await expect(service.getReputation('u1')).resolves.toBe(stored);
    expect(reputationRepository.findOne).toHaveBeenCalledWith({
      where: { user: { id: 'u1' } },
      relations: ['user', 'logs'],
    });
  });

  it.each([
    [ReputationEvent.POST_CREATED, 5],
    [ReputationEvent.POST_LIKED, 1],
    [ReputationEvent.REPOST, 3],
    [ReputationEvent.COMMENT_CREATED, 2],
    [ReputationEvent.TIP_SENT, 3],
    [ReputationEvent.TIP_RECEIVED, 10],
    [ReputationEvent.PROPOSAL_CREATED, 10],
    [ReputationEvent.VOTE_CAST, 2],
    [ReputationEvent.DATA_SHARED, 1],
    [ReputationEvent.INTERACTION_RECEIVED, 0.5],
  ])('awards the documented points for %s', async (event, points) => {
    reputationRepository.findOne.mockResolvedValue({
      id: 'rep-1',
      score: 0,
      earnedCryptocurrency: 0,
    });

    await service.addReputation(event, user);

    expect(reputationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ score: points, earnedCryptocurrency: points * 0.001 })
    );
    expect(reputationLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ event, points, cryptocurrencyEarned: points * 0.001 })
    );
  });

  it('awards zero points for an unrecognized event', async () => {
    reputationRepository.findOne.mockResolvedValue({
      id: 'rep-1',
      score: 3,
      earnedCryptocurrency: 0,
    });

    await service.addReputation('made_up_event' as ReputationEvent, user);

    expect(reputationRepository.save).toHaveBeenCalledWith(expect.objectContaining({ score: 3 }));
  });

  it('creates the reputation row for a first-time recipient', async () => {
    reputationRepository.findOne.mockResolvedValue(null);

    await service.addReputation(ReputationEvent.POST_CREATED, user);

    expect(reputationRepository.create).toHaveBeenCalledWith({
      user,
      score: 0,
      earnedCryptocurrency: 0,
    });
    expect(reputationRepository.save).toHaveBeenCalledWith(expect.objectContaining({ score: 5 }));
  });

  it('coerces decimal strings from TypeORM instead of concatenating them', async () => {
    // Regression: decimal columns come back as strings, and `+=` used to
    // produce '1.55' instead of 6.5 for score '1.5' + 5.
    reputationRepository.findOne.mockResolvedValue({
      id: 'rep-1',
      score: '1.5',
      earnedCryptocurrency: '0.002',
    });

    await service.addReputation(ReputationEvent.POST_CREATED, user);

    expect(reputationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ score: 6.5, earnedCryptocurrency: 0.007 })
    );
  });

  it('saves the reputation row before building the log so the log carries its id', async () => {
    // Regression: create() snapshots the relation; building the log before
    // save() captured a reputation without an id and save(log) crashed.
    const callOrder: string[] = [];
    reputationRepository.save.mockImplementation(async (row: { id?: string }) => {
      if (!row.id) row.id = 'rep-1';
      callOrder.push('save-reputation');
      return row;
    });
    reputationLogRepository.create.mockImplementation((input: { reputation?: { id?: string } }) => {
      callOrder.push('create-log');
      expect(input.reputation?.id).toBe('rep-1');
      return input;
    });
    reputationRepository.findOne.mockResolvedValue(null);

    await service.addReputation(ReputationEvent.POST_CREATED, user);

    expect(callOrder).toEqual(['save-reputation', 'create-log']);
  });
});
