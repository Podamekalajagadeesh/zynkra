/**
 * Integration tests for the groups surface: discovery, join/leave (incl.
 * lockdown enforcement), the channel read/post access matrix, the privacy
 * matrix (member/non-member × public/private/secret), the role matrix
 * (member/moderator/admin), DTO validation through the production pipe
 * config, and ParseUUIDPipe handling — exercising the real controller +
 * service through HTTP with JWT auth.
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
  delete: jest.fn(async () => ({ affected: 0 })),
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
      {
        provide: ChannelsGateway,
        useValue: { sendMessageToChannel: jest.fn(), kickUserFromGroupRooms: jest.fn() },
      },
      {
        provide: ConfigService,
        useValue: { get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined) },
      },
      {
        provide: getRepositoryToken(LoginSession),
        useValue: {
          findOne: jest.fn(async () => ({ id: 's1', revokedAt: null, lastSeenAt: null })),
          update: jest.fn(),
        },
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
  let proposalsRepo: ReturnType<typeof mockRepo>;
  let challengesRepo: ReturnType<typeof mockRepo>;
  let tokenU1: string;
  let tokenU2: string;

  beforeAll(async () => {
    const ref = await createModule();
    app = ref.createNestApplication();
    // Same options as the global pipe in main.ts.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true })
    );
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
    proposalsRepo = app.get(getRepositoryToken(Proposal));
    challengesRepo = app.get(getRepositoryToken(CommunityChallenge));
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

      const r = await request(app.getHttpServer()).get('/groups/discover').set(auth(tokenU1));
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
        .post('/groups/11111111-1111-4111-8111-111111111111/join')
        .set(auth(tokenU2));
      expect(r.status).toBe(201);
      expect(r.body).toMatchObject({ role: 'member' });
      expect(groupMembersRepo.save).toHaveBeenCalled();
    });

    it('404s for secret groups', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.SECRET });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post('/groups/11111111-1111-4111-8111-111111111111/join')
        .set(auth(tokenU2));
      expect(r.status).toBe(404);
    });

    it('403s during an active lockdown', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue({
        id: 'l1',
        activeUntil: new Date(Date.now() + 60_000),
      });

      const r = await request(app.getHttpServer())
        .post('/groups/11111111-1111-4111-8111-111111111111/join')
        .set(auth(tokenU2));
      expect(r.status).toBe(403);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('POST /groups/:groupId/leave', () => {
    it('404s for non-members', async () => {
      groupMembersRepo.findOne.mockResolvedValue(null);
      const r = await request(app.getHttpServer())
        .post('/groups/11111111-1111-4111-8111-111111111111/leave')
        .set(auth(tokenU2));
      expect(r.status).toBe(404);
    });

    it('keeps the owner from leaving', async () => {
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: { id: 'u1' }, role: 'admin' });
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', owner: { id: 'u1' } });

      const r = await request(app.getHttpServer())
        .post('/groups/11111111-1111-4111-8111-111111111111/leave')
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
        .get('/groups/channels/22222222-2222-4222-8222-222222222222/messages')
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
        .get('/groups/channels/22222222-2222-4222-8222-222222222222/messages')
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
        .get('/groups/channels/22222222-2222-4222-8222-222222222222/messages')
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
        .post('/groups/channels/22222222-2222-4222-8222-222222222222/messages')
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
        .post('/groups/channels/22222222-2222-4222-8222-222222222222/messages')
        .set(auth(tokenU1))
        .send({ content: 'hello' });
      expect(r.status).toBe(201);
      expect(r.body).toMatchObject({ content: 'hello' });
      expect(channelMembersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'member' })
      );
    });

    it('403s broadcast posts from non-admin channel members', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c2',
        type: 'broadcast',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: { id: 'u1' }, role: 'member' });
      channelMembersRepo.findOne.mockResolvedValue({ id: 'cm1', role: 'member' });

      const r = await request(app.getHttpServer())
        .post('/groups/channels/33333333-3333-4333-8333-333333333333/messages')
        .set(auth(tokenU1))
        .send({ content: 'announcement' });
      expect(r.status).toBe(403);
      expect(messagesRepo.save).not.toHaveBeenCalled();
    });

    it('lets group admins post in broadcast channels', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c2',
        type: 'broadcast',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: { id: 'u1' }, role: 'admin' });
      channelMembersRepo.findOne.mockResolvedValue(null);
      messagesRepo.save.mockResolvedValue({ id: 'msg2', content: 'announcement' });

      const r = await request(app.getHttpServer())
        .post('/groups/channels/33333333-3333-4333-8333-333333333333/messages')
        .set(auth(tokenU1))
        .send({ content: 'announcement' });
      expect(r.status).toBe(201);
    });

    it('requires a JWT on message reads', async () => {
      const r = await request(app.getHttpServer()).get(
        '/groups/channels/22222222-2222-4222-8222-222222222222/messages'
      );
      expect(r.status).toBe(401);
    });
  });

  describe('privacy matrix (member × public/private/secret)', () => {
    const G = '11111111-1111-4111-8111-111111111111';

    it('403s a private-group lockdown read for non-members', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .get(`/groups/${G}/lockdown`)
        .set(auth(tokenU2));
      expect(r.status).toBe(403);
      expect(lockdownsRepo.findOne).not.toHaveBeenCalled();
    });

    it('allows a private-group lockdown read for members', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm2', user: { id: 'u2' }, role: 'member' });
      lockdownsRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .get(`/groups/${G}/lockdown`)
        .set(auth(tokenU2));
      expect(r.status).toBe(200);
    });

    it('404s secret-group proposal creation for non-members (no existence leak)', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.SECRET });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/proposals`)
        .set(auth(tokenU2))
        .send({ title: 'T', description: 'D' });
      expect(r.status).toBe(404);
      expect(proposalsRepo.save).not.toHaveBeenCalled();
    });

    it('lets members create proposals in secret groups', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.SECRET, isDao: true });
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm2', user: { id: 'u2' }, role: 'member' });
      proposalsRepo.save.mockImplementation(async (input: unknown) => input);

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/proposals`)
        .set(auth(tokenU2))
        .send({ title: 'T', description: 'D' });
      expect(r.status).toBe(201);
    });

    it('403s private-group proposal reads for non-members', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .get(`/groups/${G}/proposals`)
        .set(auth(tokenU2));
      expect(r.status).toBe(403);
    });

    it('404s secret-group calendar creation for non-members', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.SECRET });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/calendar-events`)
        .set(auth(tokenU2))
        .send({ title: 'Standup', startTime: '2026-11-02T09:00:00.000Z', endTime: '2026-11-02T09:30:00.000Z' });
      expect(r.status).toBe(404);
    });

    it('403s private-group todo creation for non-members', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/todo-items`)
        .set(auth(tokenU2))
        .send({ title: 'Write brief' });
      expect(r.status).toBe(403);
    });

    it('applies privacy to vote routes through proposal resolution', async () => {
      proposalsRepo.findOne.mockResolvedValue({ id: 'p1', group: { id: 'g1' } });
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PRIVATE });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .post('/groups/proposals/33333333-3333-4333-8333-333333333333/votes')
        .set(auth(tokenU2))
        .send({ choice: true });
      expect(r.status).toBe(403);
    });

    it('404s role-gated routes on secret groups for outsiders', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.SECRET });
      groupMembersRepo.findOne.mockResolvedValue(null);

      const r = await request(app.getHttpServer())
        .put(`/groups/${G}/members/66666666-6666-4666-8666-666666666666`)
        .set(auth(tokenU2))
        .send({ role: 'moderator' });
      expect(r.status).toBe(404);
    });
  });

  describe('role matrix (member/moderator/admin)', () => {
    const G = '11111111-1111-4111-8111-111111111111';
    const U2 = '66666666-6666-4666-8666-666666666666';

    // Membership lookups serve both the guard (caller `u1` from the JWT) and
    // the service (target = the :userId route UUID) through one repository —
    // key them apart by user id.
    const TARGET_USER_ID = '66666666-6666-4666-8666-666666666666';
    const mockMemberships = (callerRole: string | null, targetRole = 'member') => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', owner: { id: 'u9' } });
      groupMembersRepo.findOne.mockImplementation((async (opts: any) => {
        const uid = opts?.where?.user?.id;
        if (uid === 'u1') {
          return callerRole ? { id: 'm1', user: { id: 'u1' }, role: callerRole } : null;
        }
        if (uid === TARGET_USER_ID || uid === 'u2') {
          return { id: 'm2', user: { id: uid }, role: targetRole };
        }
        return null;
      }) as any);
    };

    it('401s role changes without a token', async () => {
      const r = await request(app.getHttpServer())
        .put(`/groups/${G}/members/${U2}`)
        .send({ role: 'moderator' });
      expect(r.status).toBe(401);
    });

    it('403s role changes from plain members', async () => {
      mockMemberships('member');
      const r = await request(app.getHttpServer())
        .put(`/groups/${G}/members/${U2}`)
        .set(auth(tokenU1))
        .send({ role: 'moderator' });
      expect(r.status).toBe(403);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });

    it('403s role changes from moderators (route is admin-only)', async () => {
      mockMemberships('moderator');
      const r = await request(app.getHttpServer())
        .put(`/groups/${G}/members/${U2}`)
        .set(auth(tokenU1))
        .send({ role: 'admin' });
      expect(r.status).toBe(403);
    });

    it('lets admins change roles', async () => {
      mockMemberships('admin');
      groupMembersRepo.save.mockImplementation(async (input: any) => input);

      const r = await request(app.getHttpServer())
        .put(`/groups/${G}/members/${U2}`)
        .set(auth(tokenU1))
        .send({ role: 'moderator' });
      expect(r.status).toBe(200);
      expect(r.body).toMatchObject({ role: 'moderator' });
    });

    it('403s changing the group owner’s role', async () => {
      mockMemberships('admin');
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', owner: { id: TARGET_USER_ID } });

      const r = await request(app.getHttpServer())
        .put(`/groups/${G}/members/${U2}`)
        .set(auth(tokenU1))
        .send({ role: 'member' });
      expect(r.status).toBe(403);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });

    it('403s demoting the last remaining admin', async () => {
      mockMemberships('admin', 'admin');
      groupMembersRepo.count.mockResolvedValue(1);

      const r = await request(app.getHttpServer())
        .put(`/groups/${G}/members/66666666-6666-4666-8666-666666666666`)
        .set(auth(tokenU1))
        .send({ role: 'member' });
      expect(r.status).toBe(403);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });

    it('403s lockdown enables from moderators', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue({
        id: 'm1',
        user: { id: 'u1' },
        role: 'moderator',
      });

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/lockdown`)
        .set(auth(tokenU1))
        .send({ mode: 'full', durationHours: 24 });
      expect(r.status).toBe(403);
      expect(lockdownsRepo.save).not.toHaveBeenCalled();
    });

    it('lets admins enable lockdown', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: { id: 'u1' }, role: 'admin' });
      lockdownsRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.save.mockImplementation(async (input: any) => input);

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/lockdown`)
        .set(auth(tokenU1))
        .send({ mode: 'full', durationHours: 24 });
      expect(r.status).toBe(201);
      expect(r.body).toMatchObject({ mode: 'full' });
    });

    it('403s challenge updates from plain members (contributions stay open)', async () => {
      challengesRepo.findOne.mockResolvedValue({
        id: 'ch1',
        group: { id: 'g1' },
      });
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue({
        id: 'm1',
        user: { id: 'u1' },
        role: 'member',
      });

      const r = await request(app.getHttpServer())
        .put('/groups/challenges/44444444-4444-4444-8444-444444444444')
        .set(auth(tokenU1))
        .send({ title: 'Renamed by a random member' });
      expect(r.status).toBe(403);
    });
  });

  describe('lockdown modes on join', () => {
    const G = '11111111-1111-4111-8111-111111111111';

    it('lets joins through during MUTE_NEW (newcomers are muted instead)', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue({
        id: 'l1',
        mode: 'mute_new',
        activeUntil: new Date(Date.now() + 60_000),
      });
      groupMembersRepo.save.mockImplementation(async (input: any) => input);

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/join`)
        .set(auth(tokenU2));
      expect(r.status).toBe(201);
      expect(groupMembersRepo.save).toHaveBeenCalled();
    });

    it('still blocks joins during FULL lockdown', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });
      groupMembersRepo.findOne.mockResolvedValue(null);
      lockdownsRepo.findOne.mockResolvedValue({
        id: 'l1',
        mode: 'full',
        activeUntil: new Date(Date.now() + 60_000),
      });

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/join`)
        .set(auth(tokenU2));
      expect(r.status).toBe(403);
      expect(groupMembersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('leaving drops channel rooms (E14)', () => {
    const G = '11111111-1111-4111-8111-111111111111';

    it('kicks the leaver out of every channel room', async () => {
      groupMembersRepo.findOne.mockResolvedValue({ id: 'm1', user: { id: 'u1' }, role: 'member' });
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', owner: { id: 'u9' } });
      channelsRepo.find.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      const gateway = app.get(ChannelsGateway);

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/leave`)
        .set(auth(tokenU1));
      expect(r.status).toBe(201);
      expect(gateway.kickUserFromGroupRooms).toHaveBeenCalledWith('u1', ['c1', 'c2']);
      expect(channelMembersRepo.delete).toHaveBeenCalled();
    });
  });

  describe('broadcast widening', () => {
    it('lets group moderators post in broadcast channels', async () => {
      channelsRepo.findOne.mockResolvedValue({
        id: 'c2',
        type: 'broadcast',
        group: { id: 'g1', privacy: GroupPrivacy.PUBLIC },
      });
      groupMembersRepo.findOne.mockResolvedValue({
        id: 'm1',
        user: { id: 'u1' },
        role: 'moderator',
      });
      channelMembersRepo.findOne.mockResolvedValue(null);
      messagesRepo.save.mockResolvedValue({ id: 'msg3', content: 'announcement' });

      const r = await request(app.getHttpServer())
        .post('/groups/channels/33333333-3333-4333-8333-333333333333/messages')
        .set(auth(tokenU1))
        .send({ content: 'announcement' });
      expect(r.status).toBe(201);
    });
  });

  describe('DTO validation through the production pipe', () => {
    const G = '11111111-1111-4111-8111-111111111111';

    it('400s a non-ISO calendar startTime', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/calendar-events`)
        .set(auth(tokenU1))
        .send({ title: 'Standup', startTime: 'tomorrow morning', endTime: '2026-11-02T09:30:00.000Z' });
      expect(r.status).toBe(400);
    });

    it('400s an empty assigneeId on todo creation', async () => {
      groupsRepo.findOne.mockResolvedValue({ id: 'g1', privacy: GroupPrivacy.PUBLIC });

      const r = await request(app.getHttpServer())
        .post(`/groups/${G}/todo-items`)
        .set(auth(tokenU1))
        .send({ title: 'Task', assigneeId: '' });
      expect(r.status).toBe(400);
    });

    it('strips unknown body fields on group creation instead of failing', async () => {
      groupsRepo.save.mockImplementation(async (input: unknown) => input);
      groupMembersRepo.save.mockImplementation(async (input: unknown) => input);

      const r = await request(app.getHttpServer())
        .post('/groups')
        .set(auth(tokenU1))
        .send({ name: 'Fresh Group', injected: 'should be stripped' });
      expect(r.status).toBe(201);
      expect(groupsRepo.save).toHaveBeenCalledWith(
        expect.not.objectContaining({ injected: expect.anything() })
      );
    });
  });

  describe('ParseUUIDPipe rejects malformed ids with 400', () => {
    it('on join/leave routes', async () => {
      const r = await request(app.getHttpServer())
        .post('/groups/not-a-uuid/join')
        .set(auth(tokenU1));
      expect(r.status).toBe(400);
    });

    it('on channel message reads', async () => {
      const r = await request(app.getHttpServer())
        .get('/groups/channels/not-a-uuid/messages')
        .set(auth(tokenU1));
      expect(r.status).toBe(400);
    });

    it('on channel membership routes', async () => {
      const r = await request(app.getHttpServer())
        .post('/groups/channels/not-a-uuid/join')
        .set(auth(tokenU1));
      expect(r.status).toBe(400);
    });
  });
});
