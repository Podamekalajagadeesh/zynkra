/**
 * Integration tests for the groups surface: discovery, join/leave (incl.
 * lockdown enforcement), and the channel read/post access matrix —
 * exercising the real controller + service through HTTP with JWT auth.
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { GroupsController } from '../src/groups/groups.controller';
import { GroupsService } from '../src/groups/groups.service';
import { GroupPrivacyGuard } from '../src/groups/guards/group-privacy.guard';
import { GroupRoleGuard } from '../src/groups/guards/group-role.guard';
import { UsersService } from '../src/users/users.service';
import { ReputationService } from '../src/reputation/reputation.service';
import { ChannelsGateway } from '../src/groups/channels.gateway';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { User } from '../src/users/entities/user.entity';
import { Group } from '../src/groups/entities/group.entity';
import { Channel, ChannelMember } from '../src/groups/entities/channel.entity';
import { GroupMember } from '../src/groups/entities/group-member.entity';
import { GroupLockdown } from '../src/groups/entities/group-lockdown.entity';
import { Message } from '../src/dms/entities/message.entity';
import { Conversation } from '../src/dms/entities/conversation.entity';
import { Proposal } from '../src/groups/entities/proposal.entity';
import { Vote } from '../src/groups/entities/vote.entity';
import { CommunityChallenge } from '../src/groups/entities/community-challenge.entity';
import { ChallengeContribution } from '../src/groups/entities/challenge-contribution.entity';
import { CalendarEvent } from '../src/groups/entities/calendar-event.entity';
import { TodoItem } from '../src/groups/entities/todo-item.entity';
import { GroupPrivacy } from '../src/groups/enums/group-privacy.enum';

const mockRepo = () => ({
  find: jest.fn(async () => []),
  findOne: jest.fn(async () => null),
  create: jest.fn((input: unknown) => input),
  save: jest.fn(async (input: unknown) => input),
  remove: jest.fn(async (input: unknown) => input),
  count: jest.fn(async () => 0),
  update: jest.fn(async () => undefined),
  query: jest.fn(async () => []),
});

function createModule() {
  return Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'test-secret' }),
    ],
    controllers: [GroupsController],
    providers: [
      GroupsService,
      GroupPrivacyGuard,
      GroupRoleGuard,
      {
        provide: UsersService,
        useValue: {
          findOneById: jest.fn(async (id: string) => ({
            id,
            email: `${id}@test.com`,
            status: 'active',
            banned: false,
            role: 'user',
          })),
        },
      },
      { provide: ReputationService, useValue: { addReputation: jest.fn() } },
      { provide: ChannelsGateway, useValue: { sendMessageToChannel: jest.fn() } },
      {
        provide: ConfigService,
        useValue: { get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined) },
      },
      {
        provide: getRepositoryToken(LoginSession),
        useValue: { findOne: jest.fn(async () => ({ id: 's1', revokedAt: null, lastSeenAt: null })), update: jest.fn() },
      },
      {
        provide: getRepositoryToken(User),
        useValue: {
          findOne: jest.fn(async (opts: any) => ({
            id: opts?.where?.id,
            email: `${opts?.where?.id}@test.com`,
            status: 'active',
            banned: false,
            role: 'user',
          })),
        },
      },
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
      JwtStrategy,
    ],
  }).compile();
}

describe('Groups (HTTP integration)', () => {
  let app: INestApplication;
  let groupsRepo: ReturnType<typeof mockRepo>;
  let channelsRepo: ReturnType<typeof mockRepo>;
  let channelMembersRepo: ReturnType<typeof mockRepo>;
  let groupMembersRepo: ReturnType<typeof mockRepo>;
  let lockdownsRepo: ReturnType<typeof mockRepo>;
  let messagesRepo: ReturnType<typeof mockRepo>;
  let tokenU1: string;
  let tokenU2: string;

  beforeAll(async () => {
    const ref = await createModule();
    app = ref.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    const jwt = app.get(JwtService);
    tokenU1 = jwt.sign({ sub: 'u1', sid: 's1' });
    tokenU2 = jwt.sign({ sub: 'u2', sid: 's1' });
    groupsRepo = app.get(getRepositoryToken(Group));
    channelsRepo = app.get(getRepositoryToken(Channel));
    channelMembersRepo = app.get(getRepositoryToken(ChannelMember));
    groupMembersRepo = app.get(getRepositoryToken(GroupMember));
    lockdownsRepo = app.get(getRepositoryToken(GroupLockdown));
    messagesRepo = app.get(getRepositoryToken(Message));
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('GET /groups/discover', () => {
    it('401s without a token', async () => {
      const r = await request(app.getHttpServer()).get('/groups/discover');
      expect(r.status).toBe(401);
    });

    it('lists public groups the caller has not joined', async () => {
      groupMembersRepo.find.mockResolvedValue([{ group: { id: 'g-joined' } }]);
      groupsRepo.find.mockResolvedValue([
        { id: 'g-joined', privacy: GroupPrivacy.PUBLIC },
        { id: 'g-open', privacy: GroupPrivacy.PUBLIC },
      ]);

      const r = await request(app.getHttpServer())
        .get('/groups/discover')
        .set(auth(tokenU1));
      expect(r.status).toBe(200);
      expect(r.body.map((g: any) => g.id)).toEqual(['g-open']);
    });
  });

  describe('POST /groups/:groupId/join', () => {
    it('joins a public group', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post('/groups/g1/join')
        .set(auth(tokenU2));
      expect(r.status).toBe(201);
      expect(r.body).toMatchObject({ role: 'member' });
      expect(groupMembersRepo.save).toHaveBeenCalled();
    });

    it('404s for secret groups', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.SECRET });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post('/groups/g1/join')
        .set(auth(tokenU2));
      expect(r.status).toBe(404);
    });

    it('403s during an active lockdown', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue({ id: 'l1', activeUntil: new Date(Date.now() + 60_000) });

      const r = await request(app.getHttpServer())
        .post('/groups/g1/join')
        .set(auth(tokenU2));
      expect(r.status).toBe(403);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('POST /groups/:groupId/leave', () => {
    it('404s for non-members', async () => {
      groupMembersRepo.findOne.mockResolvedValue(null);
      const r = await request(app.getHttpServer())
        .post('/groups/g1/leave')
        .set(auth(tokenU2));
      expect(r.status).toBe(404);
    });

    it('keeps the owner from leaving', async () => {
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: { id: 'u1' }, role: 'admin' });
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', owner: { id: 'u1' } });

      const r = await request(app.getHttpServer())
        .post('/groups/g1/leave')
        .set(auth(tokenU1));
      expect(r.status).toBe(403);
      expect(groupMembersRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('channel message access matrix', () => {
    it('lets any authenticated user read public-group channels', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      messagesRepo.find.mockResolvedValue([]);

      const r = await request(app.getHttpServer())
        .get('/groups/channels/c1/messages')
        .set(auth(tokenU2));
      expect(r.status).toBe(200);
      expect(groupMembersRepo.findOne).not.toHaveBeenCalled();
    });

    it('403s private-group channel reads for non-members', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.PRIVATE },
      });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .get('/groups/channels/c1/messages')
        .set(auth(tokenU2));
      expect(r.status).toBe(403);
      expect(messagesRepo.find).not.toHaveBeenCalled();
    });

    it('404s secret-group channel reads for non-members', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.SECRET },
      });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .get('/groups/channels/c1/messages')
        .set(auth(tokenU2));
      expect(r.status).toBe(404);
    });

    it('rejects posting into a public group channel without membership', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post('/groups/channels/c1/messages')
        .set(auth(tokenU2))
        .send({ content: 'hello' });
      expect(r.status).toBe(403);
      expect(messagesRepo.save).not.toHaveBeenCalled();
    });

    it('posts as a group member', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c1',
        type: 'group',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: { id: 'u1' }, role: 'member' });
      channelMembersRepo.findOne.mockResolvedValue(null);
      messagesRepo.save.mockResolvedValue({ id: 'msg1', content: 'hello' });

      const r = await request(app.getHttpServer())
        .post('/groups/channels/c1/messages')
        .set(auth(tokenU1))
        .send({ content: 'hello' });
      expect(r.status).toBe(201);
      expect(r.body).toMatchObject({ content: 'hello' });
      expect(channelMembersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'member' }),
      );
    });

    it('401s broadcast posts from non-admin channel members', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c2',
        type: 'broadcast',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      channelMembersRepo.findOne.mockResolvedValue({ id: 'cm1', role: 'member' });

      const r = await request(app.getHttpServer())
        .post('/groups/channels/c2/messages')
        .set(auth(tokenU1))
        .send({ content: 'announcement' });
      expect(r.status).toBe(401);
      expect(messagesRepo.save).not.toHaveBeenCalled();
    });

    it('requires a JWT on message reads', async () => {
      const r = await request(app.getHttpServer()).get('/groups/channels/c1/messages');
      expect(r.status).toBe(401);
    });
  });
});
