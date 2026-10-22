import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { Channel, ChannelMember } from './entities/channel.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupRole } from './group-role.enum';
import { GroupLockdown } from './entities/group-lockdown.entity';
import { Message } from '../dms/entities/message.entity';
import { Conversation } from '../dms/entities/conversation.entity';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { CommunityChallenge } from './entities/community-challenge.entity';
import { ChallengeContribution } from './entities/challenge-contribution.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { TodoItem } from './entities/todo-item.entity';
import { GroupPrivacy } from './enums/group-privacy.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ReputationService } from '../reputation/reputation.service';
import { ChannelsGateway } from './channels.gateway';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((input: unknown) => input),
  save: jest.fn(async (input: unknown) => input),
  remove: jest.fn(async (input: unknown) => input),
  count: jest.fn(),
});

type Repo = ReturnType<typeof mockRepo>;

describe('GroupsService (membership & channel access)', () => {
  let service: GroupsService;
  let groupsRepo: Repo;
  let channelsRepo: Repo;
  let channelMembersRepo: Repo;
  let groupMembersRepo: Repo;
  let lockdownsRepo: Repo;
  let messagesRepo: Repo;
  let gateway: { sendMessageToChannel: jest.Mock };

  const user = { id: 'u1' } as User;
  const stranger = { id: 'u2' } as User;
  const owner = { id: 'u0' } as User;

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
        { provide: ReputationService, useValue: { addReputation: jest.fn() } },
        { provide: ChannelsGateway, useValue: { sendMessageToChannel: jest.fn() } },
      ],
    }).compile();

    service = module.get(GroupsService);
    groupsRepo = module.get(getRepositoryToken(Group));
    channelsRepo = module.get(getRepositoryToken(Channel));
    channelMembersRepo = module.get(getRepositoryToken(ChannelMember));
    groupMembersRepo = module.get(getRepositoryToken(GroupMember));
    lockdownsRepo = module.get(getRepositoryToken(GroupLockdown));
    messagesRepo = module.get(getRepositoryToken(Message));
    messagesRepo.find.mockResolvedValue([]);
    gateway = module.get(ChannelsGateway) as typeof gateway;
  });

  describe('joinGroup', () => {
    it('joins a public group as a plain member', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue(null);

      const member = await service.joinGroup('g1', user);

      expect(member).toEqual({
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
        user,
        role: GroupRole.MEMBER,
      });
      expect(groupMembersRepo.save).toHaveBeenCalled();
    });

    it('joins a private group by id (not advertised, but valid once known)', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue(null);

      await expect(service.joinGroup('g1', user)).resolves.toMatchObject({
        role: GroupRole.MEMBER,
      });
    });

    it('hides secret groups behind a 404', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.SECRET });
      groupMembersRepo.findOne.mockResolvedValue(null);

      await expect(service.joinGroup('g1', user)).rejects.toBeInstanceOf(NotFoundException);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });

    it('is idempotent for existing members', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      const existing = { group: { id: 'g1' }, user, role: GroupRole.MEMBER };
      groupMembersRepo.findOne.mockResolvedValue(existing);

      await expect(service.joinGroup('g1', user)).resolves.toBe(existing);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });

    it('rejects joins while the group is in lockdown', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue({
        id: 'l1',
        activeUntil: new Date(Date.now() + 60_000),
      });

      await expect(service.joinGroup('g1', user)).rejects.toBeInstanceOf(ForbiddenException);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });

    it('404s for an unknown group', async () => {
      groupsRepo.findOne.mockResolvedValue(null);
      await expect(service.joinGroup('nope', user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('leaveGroup', () => {
    it('removes a non-owner member', async () => {
      const membership = { id: 'm1', user, role: GroupRole.MEMBER };
      groupMembersRepo.findOne.mockResolvedValue(membership);
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', owner });

      await service.leaveGroup('g1', user);
      expect(groupMembersRepo.remove).toHaveBeenCalledWith(membership);
    });

    it('keeps the owner from leaving', async () => {
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: owner, role: GroupRole.ADMIN });
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', owner });

      await expect(service.leaveGroup('g1', owner)).rejects.toBeInstanceOf(ForbiddenException);
      expect(groupMembersRepo.remove).not.toHaveBeenCalled();
    });

    it('404s when the caller is not a member', async () => {
      groupMembersRepo.findOne.mockResolvedValue(null);
      await expect(service.leaveGroup('g1', user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getDiscoverableGroups', () => {
    it('returns public groups the caller has not joined', async () => {
      groupMembersRepo.find.mockResolvedValue([{ group: { id: 'g-joined' } }]);
      groupsRepo.find.mockResolvedValue([{ id: 'g-joined' }, { id: 'g-open' }, { id: 'g-other' }]);

      const result = await service.getDiscoverableGroups(user);
      expect(result.map((g) => g.id)).toEqual(['g-open', 'g-other']);
      expect(groupsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { privacy: GroupPrivacy.PUBLIC } })
      );
    });
  });

  describe('channel read access', () => {
    const channelOf = (privacy: GroupPrivacy) => ({
      id: 'c1',
      type: 'group',
      group: { id: 'g1', privacy },
    });

    it('lets any authenticated user read public-group channels', async () => {
      channelsRepo.findOne.mockResolvedValue(channelOf(GroupPrivacy.PUBLIC));
      groupMembersRepo.findOne.mockResolvedValue(null);

      await expect(service.getMessages('c1', stranger.id)).resolves.toBeDefined();
      expect(groupMembersRepo.findOne).not.toHaveBeenCalled();
    });

    it('blocks non-members of private groups with 403', async () => {
      channelsRepo.findOne.mockResolvedValue(channelOf(GroupPrivacy.PRIVATE));
      groupMembersRepo.findOne.mockResolvedValue(null);

      await expect(service.getMessages('c1', stranger.id)).rejects.toBeInstanceOf(
        ForbiddenException
      );
      expect(messagesRepo.find).not.toHaveBeenCalled();
    });

    it('blocks non-members of secret groups with 404 (no existence leak)', async () => {
      channelsRepo.findOne.mockResolvedValue(channelOf(GroupPrivacy.SECRET));
      groupMembersRepo.findOne.mockResolvedValue(null);

      await expect(service.getMessages('c1', stranger.id)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('lets private-group members read', async () => {
      channelsRepo.findOne.mockResolvedValue(channelOf(GroupPrivacy.PRIVATE));
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user, role: GroupRole.MEMBER });

      await expect(service.getMessages('c1', user.id)).resolves.toBeDefined();
      expect(messagesRepo.find).toHaveBeenCalled();
    });

    it('404s for an unknown channel', async () => {
      channelsRepo.findOne.mockResolvedValue(null);
      await expect(service.getMessages('c1', user.id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addMessage', () => {
    const publicChannel = {
      id: 'c1',
      type: 'group',
      group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
    };
    const broadcastChannel = {
      id: 'c2',
      type: 'broadcast',
      group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
    };

    it('rejects posting to a public group channel without membership', async () => {
      channelsRepo.findOne.mockResolvedValue(publicChannel);
      groupMembersRepo.findOne.mockResolvedValue(null);

      await expect(service.addMessage('c1', 'hi', stranger)).rejects.toBeInstanceOf(
        ForbiddenException
      );
      expect(messagesRepo.save).not.toHaveBeenCalled();
    });

    it('posts as a group member and creates the implicit channel membership once', async () => {
      channelsRepo.findOne.mockResolvedValue(publicChannel);
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user, role: GroupRole.MEMBER });
      channelMembersRepo.findOne.mockResolvedValue(null);

      const saved = await service.addMessage('c1', 'hi', user);

      expect(saved).toMatchObject({ content: 'hi' });
      expect(channelMembersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'member' })
      );
      expect(gateway.sendMessageToChannel).toHaveBeenCalledWith('c1', saved);
    });

    it('does not duplicate the channel membership on later posts', async () => {
      channelsRepo.findOne.mockResolvedValue(publicChannel);
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user, role: GroupRole.MEMBER });
      channelMembersRepo.findOne.mockResolvedValue({ id: 'cm1' });

      await service.addMessage('c1', 'again', user);
      expect(channelMembersRepo.save).not.toHaveBeenCalled();
      expect(messagesRepo.save).toHaveBeenCalled();
    });

    it('blocks reads-then-posts escalation on private groups', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.PRIVATE },
      });
      groupMembersRepo.findOne.mockResolvedValue(null);

      await expect(service.addMessage('c1', 'hi', stranger)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('requires channel-admin role to post in broadcast channels', async () => {
      channelsRepo.findOne.mockResolvedValue(broadcastChannel);
      channelMembersRepo.findOne.mockResolvedValue({ id: 'cm1', role: 'member' });

      await expect(service.addMessage('c2', 'announcement', user)).rejects.toBeInstanceOf(
        UnauthorizedException
      );
      expect(messagesRepo.save).not.toHaveBeenCalled();
    });

    it('lets broadcast channel admins post', async () => {
      channelsRepo.findOne.mockResolvedValue(broadcastChannel);
      channelMembersRepo.findOne.mockResolvedValue({ id: 'cm1', role: 'admin' });

      await expect(service.addMessage('c2', 'announcement', user)).resolves.toMatchObject({
        content: 'announcement',
      });
    });
  });

  describe('joinChannel', () => {
    it('applies the same read policy before creating membership', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.PRIVATE },
      });
      groupMembersRepo.findOne.mockResolvedValue(null);

      await expect(service.joinChannel('c1', stranger)).rejects.toBeInstanceOf(ForbiddenException);
      expect(channelMembersRepo.save).not.toHaveBeenCalled();
    });

    it('lets a public-group user join a channel', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      channelMembersRepo.findOne.mockResolvedValue(null);

      const member = await service.joinChannel('c1', user);
      expect(member).toMatchObject({ role: 'member' });
    });
  });
});
