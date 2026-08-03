import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { Channel, ChannelMember } from './entities/channel.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupRole } from './group-role.enum';
import { GroupLockdown, LockdownMode } from './entities/group-lockdown.entity';
import { Message } from '../dms/entities/message.entity';
import { Conversation } from '../dms/entities/conversation.entity';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { CommunityChallenge } from './entities/community-challenge.entity';
import { ChallengeContribution } from './entities/challenge-contribution.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { TodoItem } from './entities/todo-item.entity';
import { UsersService } from '../users/users.service';
import { TokenGatedContentService } from '../token-gated-content/token-gated-content.service';
import { ReputationService } from '../reputation/reputation.service';
import { ChannelsGateway } from './channels.gateway';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
});

describe('GroupsService (raid protection)', () => {
  let service: GroupsService;
  let groupMembersRepo: jest.Mocked<any>;
  let lockdownsRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getRepositoryToken(Group), useValue: mockRepo() },
        { provide: getRepositoryToken(Channel), useValue: mockRepo() },
        { provide: getRepositoryToken(ChannelMember), useValue: mockRepo() },
        { provide: getRepositoryToken(Message), useValue: mockRepo() },
        { provide: getRepositoryToken(Conversation), useValue: mockRepo() },
        { provide: getRepositoryToken(GroupMember), useValue: mockRepo() },
        { provide: getRepositoryToken(GroupLockdown), useValue: mockRepo() },
        { provide: getRepositoryToken(Proposal), useValue: mockRepo() },
        { provide: getRepositoryToken(Vote), useValue: mockRepo() },
        { provide: getRepositoryToken(CommunityChallenge), useValue: mockRepo() },
        { provide: getRepositoryToken(ChallengeContribution), useValue: mockRepo() },
        { provide: getRepositoryToken(CalendarEvent), useValue: mockRepo() },
        { provide: getRepositoryToken(TodoItem), useValue: mockRepo() },
        { provide: UsersService, useValue: { findOneById: jest.fn() } },
        { provide: TokenGatedContentService, useValue: {} },
        { provide: ReputationService, useValue: {} },
        { provide: ChannelsGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    groupMembersRepo = module.get(getRepositoryToken(GroupMember));
    lockdownsRepo = module.get(getRepositoryToken(GroupLockdown));
  });

  describe('detectPotentialRaid', () => {
    it('returns 0 when recent joins are below the threshold', async () => {
      groupMembersRepo.find.mockResolvedValue([
        { createdAt: new Date() },
        { createdAt: new Date() },
      ]);

      expect(await service.detectPotentialRaid('group-1')).toBe(0);
    });

    it('returns the count when the threshold is crossed', async () => {
      const recent = Array.from({ length: 12 }, () => ({ createdAt: new Date() }));
      groupMembersRepo.find.mockResolvedValue(recent);

      expect(await service.detectPotentialRaid('group-1')).toBe(12);
    });
  });

  describe('enableLockdown', () => {
    it('rejects non-admin members', async () => {
      groupMembersRepo.findOne.mockResolvedValue({
        role: GroupRole.MEMBER,
      });

      await expect(
        service.enableLockdown('group-1', 'user-1', LockdownMode.APPROVAL),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates an active lockdown for an admin', async () => {
      groupMembersRepo.findOne.mockResolvedValue({ role: GroupRole.ADMIN });
      (service as any).groupsRepository.findOne.mockResolvedValue({ id: 'group-1' });
      (service as any).usersService.findOneById.mockResolvedValue({ id: 'admin-1' });
      lockdownsRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.create.mockReturnValue({
        mode: LockdownMode.MUTE_NEW,
        activeUntil: new Date(),
      });
      lockdownsRepo.save.mockImplementation((data) => data);

      const result = await service.enableLockdown(
        'group-1',
        'admin-1',
        LockdownMode.MUTE_NEW,
        12,
        48,
      );

      expect(result.mode).toBe(LockdownMode.MUTE_NEW);
      expect(lockdownsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ newMemberMuteHours: 48 }),
      );
    });
  });
});
