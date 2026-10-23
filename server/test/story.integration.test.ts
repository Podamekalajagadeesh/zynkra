/**
 * Integration tests for stories endpoints.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { StoriesController } from '../src/stories/stories.controller';
import { StoriesService } from '../src/stories/stories.service';
import { MediaService } from '../src/media/media.service';
import { StoriesReactionController } from '../src/stories/stories-reaction.controller';
import { StoriesReactionService } from '../src/stories/stories-reaction.service';
import { StoriesReplyController } from '../src/stories/stories-reply.controller';
import { StoriesReplyService } from '../src/stories/stories-reply.service';
import { HighlightsController } from '../src/stories/highlights.controller';
import { HighlightsService } from '../src/stories/highlights.service';
import { UserHighlightsController } from '../src/stories/user-highlights.controller';
import { StoriesPollController } from '../src/stories/stories-poll.controller';
import { StoriesPollService } from '../src/stories/stories-poll.service';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { User } from '../src/users/entities/user.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

function createModule(overrides: Record<string, any> = {}) {
  const defaults: Record<string, jest.Mock> = {
    create: jest.fn(),
    findOne: jest.fn(),
    findActiveStoriesForUser: jest.fn(),
    trackView: jest.fn(),
    getViews: jest.fn(),
    delete: jest.fn(),
    addReaction: jest.fn(),
    addReply: jest.fn(),
  };

  return Test.createTestingModule({
    imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: 'test-secret' }),
    ],
    controllers: [
      StoriesController,
      StoriesReactionController,
      StoriesReplyController,
      HighlightsController,
      UserHighlightsController,
      StoriesPollController,
    ],
    providers: [
      { provide: StoriesService, useValue: { ...defaults, ...overrides.stories } },
      {
        provide: MediaService,
        useValue: overrides.media || {
          uploadFile: jest.fn(async (file: any, ctx: any) => ({
            id: 'media-1',
            url: '/uploads/stories/story.jpg',
            type: 'image',
            size: file?.size ?? 0,
            mimeType: file?.mimetype ?? 'image/jpeg',
          })),
        },
      },
      {
        provide: StoriesReactionService,
        useValue: { addReaction: overrides.addReaction || jest.fn() },
      },
      {
        provide: StoriesReplyService,
        useValue: {
          addReply: overrides.addReply || jest.fn(),
          getReplies: overrides.getReplies || jest.fn(),
          deleteReply: overrides.deleteReply || jest.fn(),
        },
      },
      {
        provide: HighlightsService,
        useValue: {
          create: jest.fn(),
          findAll: jest.fn(),
          findOne: jest.fn(),
          findForUser: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          ...overrides.highlights,
        },
      },
      {
        provide: StoriesPollService,
        useValue: { vote: jest.fn(), getResults: jest.fn(), ...overrides.poll },
      },
      {
        provide: ConfigService,
        useValue: { get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined) },
      },
      {
        provide: getRepositoryToken(LoginSession),
        useValue: {
          findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }),
          update: jest.fn(),
        },
      },
      {
        provide: getRepositoryToken(User),
        useValue: {
          findOne: jest.fn().mockResolvedValue({
            id: 'user-1',
            email: 'user-1@test.com',
            status: 'active',
            banned: false,
            role: 'user',
          }),
        },
      },
      JwtStrategy,
    ],
  }).compile();
}

async function buildApp(overrides: Record<string, any> = {}) {
  const ref = await createModule(overrides);
  const app = ref.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  const token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  return { app, storiesService: app.get(StoriesService) as jest.Mocked<StoriesService>, token };
}

describe('GET /stories', () => {
  it('returns 200 with active stories', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.findActiveStoriesForUser.mockResolvedValue([
      { id: 'story-1', mediaUrl: '/img.jpg' },
    ] as any);

    const r = await request(app.getHttpServer())
      .get('/stories')
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).get('/stories');
    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('POST /stories/:id/view', () => {
  it('returns 201 when view tracked', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.trackView.mockResolvedValue(undefined as any);

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/view')
      .set('Authorization', `Bearer ${token}`)
      .send({ isAnonymous: false });

    expect(r.status).toBe(201);
    expect(storiesService.trackView).toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /stories/:id/views', () => {
  it('returns 200 with views for owner', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.getViews.mockResolvedValue([{ id: 'sv-1', user: { id: 'user-2' } }] as any);

    const r = await request(app.getHttpServer())
      .get('/stories/story-1/views')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });
});

describe('DELETE /stories/:id', () => {
  it('returns 200 when deleted', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.delete.mockResolvedValue(undefined);

    const r = await request(app.getHttpServer())
      .delete('/stories/story-1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    await app.close();
  });
});

describe('POST /stories/:id/react', () => {
  it('returns 201 when reaction added', async () => {
    const mockAddReaction = jest.fn().mockResolvedValue(undefined);
    const { app, token } = await buildApp({ addReaction: mockAddReaction });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/react')
      .set('Authorization', `Bearer ${token}`)
      .send({ reaction: '❤️' });

    expect(r.status).toBe(201);
    expect(mockAddReaction).toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /stories/:id/reply', () => {
  it('returns 201 when reply added', async () => {
    const mockAddReply = jest.fn().mockResolvedValue(undefined);
    const { app, token } = await buildApp({ addReply: mockAddReply });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Cool story!' });

    expect(r.status).toBe(201);
    expect(mockAddReply).toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /stories/:id/replies', () => {
  it('returns 200 with the paginated envelope and default paging forwarded', async () => {
    const mockGetReplies = jest.fn().mockResolvedValue({
      data: [{ id: 'reply-1', text: 'Nice', user: { id: 'user-2', username: 'fan' } }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const { app, token } = await buildApp({ getReplies: mockGetReplies });

    const r = await request(app.getHttpServer())
      .get('/stories/story-1/replies')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(r.body.total).toBe(1);
    expect(r.body.data[0].user.username).toBe('fan');
    expect(mockGetReplies).toHaveBeenCalledWith('story-1', 'user-1', 1, 20);
    await app.close();
  });

  it('forwards explicit page and limit as numbers', async () => {
    const mockGetReplies = jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 0,
    });
    const { app, token } = await buildApp({ getReplies: mockGetReplies });

    const r = await request(app.getHttpServer())
      .get('/stories/story-1/replies?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(mockGetReplies).toHaveBeenCalledWith('story-1', 'user-1', 2, 5);
    await app.close();
  });

  it('falls back to defaults for garbage paging params', async () => {
    const mockGetReplies = jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    const { app, token } = await buildApp({ getReplies: mockGetReplies });

    await request(app.getHttpServer())
      .get('/stories/story-1/replies?page=abc&limit=')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(mockGetReplies).toHaveBeenCalledWith('story-1', 'user-1', 1, 20);
    await app.close();
  });

  it('maps NotFoundException from the service to 404', async () => {
    const mockGetReplies = jest.fn().mockRejectedValue(new NotFoundException('Story not found'));
    const { app, token } = await buildApp({ getReplies: mockGetReplies });

    const r = await request(app.getHttpServer())
      .get('/stories/story-1/replies')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(404);
    await app.close();
  });

  it('maps UnauthorizedException from the service to 401', async () => {
    const mockGetReplies = jest
      .fn()
      .mockRejectedValue(new UnauthorizedException('not your story'));
    const { app, token } = await buildApp({ getReplies: mockGetReplies });

    const r = await request(app.getHttpServer())
      .get('/stories/story-1/replies')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();

    const r = await request(app.getHttpServer()).get('/stories/story-1/replies');

    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('DELETE /stories/:id/replies/:replyId', () => {
  it('returns 200 when the reply is removed', async () => {
    const mockDeleteReply = jest.fn().mockResolvedValue(undefined);
    const { app, token } = await buildApp({ deleteReply: mockDeleteReply });

    const r = await request(app.getHttpServer())
      .delete('/stories/story-1/replies/reply-1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(mockDeleteReply).toHaveBeenCalledWith('story-1', 'reply-1', 'user-1');
    await app.close();
  });

  it('maps NotFoundException from the service to 404', async () => {
    const mockDeleteReply = jest.fn().mockRejectedValue(new NotFoundException('Reply not found'));
    const { app, token } = await buildApp({ deleteReply: mockDeleteReply });

    const r = await request(app.getHttpServer())
      .delete('/stories/story-1/replies/reply-1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(404);
    await app.close();
  });

  it('maps UnauthorizedException from the service to 401', async () => {
    const mockDeleteReply = jest
      .fn()
      .mockRejectedValue(new UnauthorizedException('not yours'));
    const { app, token } = await buildApp({ deleteReply: mockDeleteReply });

    const r = await request(app.getHttpServer())
      .delete('/stories/story-1/replies/reply-1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();

    const r = await request(app.getHttpServer()).delete('/stories/story-1/replies/reply-1');

    expect(r.status).toBe(401);
    await app.close();
  });
});

describe('POST /stories (multipart, elements wire contract)', () => {
  const wireElements = [
    { type: 'poll', data: { question: 'Best?', options: ['a', 'b'] } },
    { type: 'mention', data: { username: 'friend' } },
    { type: 'countdown', data: { label: 'Launch', target: '2026-11-01T00:00:00Z' } },
    { type: 'sticker', data: { stickerId: 'party-1' } },
  ];

  it('parses multipart elements into typed objects without inventing ids', async () => {
    const { app, storiesService, token } = await buildApp();
    (storiesService.create as jest.Mock).mockImplementation(async (dto) => ({
      id: 'story-1',
      textContent: dto.textContent,
      elements: dto.elements.map((element, index) => ({
        id: `00000000-0000-4000-8000-00000000000${index + 1}`,
        type: element.type,
        data: element.data,
      })),
    }));

    const r = await request(app.getHttpServer())
      .post('/stories')
      .set('Authorization', `Bearer ${token}`)
      .field('textContent', 'hello story')
      .field('elements', JSON.stringify(wireElements));

    expect(r.status).toBe(201);
    const [dto, userId] = storiesService.create.mock.calls[0];
    expect(userId).toBe('user-1');
    expect(dto.textContent).toBe('hello story');
    expect(dto.elements).toEqual(wireElements);
    for (const element of dto.elements) {
      expect((element as { id?: string }).id).toBeUndefined();
    }
    // The response stays JSON-serializable and echoes DB-shaped elements.
    expect(r.body.elements).toHaveLength(4);
    expect(r.body.elements.map((element) => element.type)).toEqual([
      'poll',
      'mention',
      'countdown',
      'sticker',
    ]);
    expect(r.body.elements[0].id).toMatch(/^[0-9a-f-]{36}$/);
    await app.close();
  });

  it('returns 400 for a malformed elements payload', async () => {
    const { app, storiesService, token } = await buildApp();

    const r = await request(app.getHttpServer())
      .post('/stories')
      .set('Authorization', `Bearer ${token}`)
      .field('textContent', 'hi')
      .field('elements', '{not json');

    expect(r.status).toBe(400);
    expect(storiesService.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns 400 for a malformed backgroundOptions payload', async () => {
    const { app, storiesService, token } = await buildApp();

    const r = await request(app.getHttpServer())
      .post('/stories')
      .set('Authorization', `Bearer ${token}`)
      .field('textContent', 'hi')
      .field('backgroundOptions', '{not json');

    expect(r.status).toBe(400);
    expect(storiesService.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('creates a text-only story when no elements field is sent', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.create.mockResolvedValue({ id: 'story-1', textContent: 'hi' } as any);

    const r = await request(app.getHttpServer())
      .post('/stories')
      .set('Authorization', `Bearer ${token}`)
      .field('textContent', 'hi');

    expect(r.status).toBe(201);
    expect(storiesService.create.mock.calls[0][0].elements).toBeUndefined();
    await app.close();
  });
});

describe('story input validation (DTO pipe)', () => {
  it('rejects a reaction body without a reaction field', async () => {
    const addReaction = jest.fn();
    const { app, token } = await buildApp({ addReaction });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/react')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(r.status).toBe(400);
    expect(addReaction).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects an over-long reaction', async () => {
    const addReaction = jest.fn();
    const { app, token } = await buildApp({ addReaction });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/react')
      .set('Authorization', `Bearer ${token}`)
      .send({ reaction: 'x'.repeat(33) });

    expect(r.status).toBe(400);
    expect(addReaction).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects a reply body without text', async () => {
    const addReply = jest.fn();
    const { app, token } = await buildApp({ addReply });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(r.status).toBe(400);
    expect(addReply).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects an over-long reply', async () => {
    const addReply = jest.fn();
    const { app, token } = await buildApp({ addReply });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/reply')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'y'.repeat(1001) });

    expect(r.status).toBe(400);
    expect(addReply).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects a non-boolean isAnonymous flag', async () => {
    const { app, storiesService, token } = await buildApp();

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/view')
      .set('Authorization', `Bearer ${token}`)
      .send({ isAnonymous: 'yes' });

    expect(r.status).toBe(400);
    expect(storiesService.trackView).not.toHaveBeenCalled();
    await app.close();
  });

  it('defaults isAnonymous to false for an empty JSON body', async () => {
    const { app, storiesService, token } = await buildApp();
    storiesService.trackView.mockResolvedValue(undefined as any);

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/view')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(r.status).toBe(201);
    expect(storiesService.trackView).toHaveBeenCalledWith('story-1', 'user-1', false);
    await app.close();
  });
});

describe('stories highlights', () => {
  const validHighlight = {
    title: 'Best moments',
    coverUrl: '/uploads/cover.jpg',
    storyIds: ['story-1'],
  };

  it('creates a highlight once the decorated DTO validates', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'h1', ...validHighlight });
    const { app, token } = await buildApp({ highlights: { create } });

    const r = await request(app.getHttpServer())
      .post('/stories/highlights')
      .set('Authorization', `Bearer ${token}`)
      .send(validHighlight);

    expect(r.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Best moments', storyIds: ['story-1'] }),
      'user-1'
    );
    await app.close();
  });

  it('rejects an empty storyIds list', async () => {
    const create = jest.fn();
    const { app, token } = await buildApp({ highlights: { create } });

    const r = await request(app.getHttpServer())
      .post('/stories/highlights')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validHighlight, storyIds: [] });

    expect(r.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects a highlight without a coverUrl', async () => {
    const create = jest.fn();
    const { app, token } = await buildApp({ highlights: { create } });

    const r = await request(app.getHttpServer())
      .post('/stories/highlights')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Best moments', storyIds: ['story-1'] });

    expect(r.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it('accepts a partial update (optional fields stay optional)', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'h1', title: 'Renamed' });
    const { app, token } = await buildApp({ highlights: { update } });

    const r = await request(app.getHttpServer())
      .patch('/stories/highlights/h1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Renamed' });

    expect(r.status).toBe(200);
    expect(update).toHaveBeenCalledWith('h1', { title: 'Renamed' }, 'user-1');
    await app.close();
  });

  it('passes the caller as viewer to findOne (owner-scoped reads)', async () => {
    const findOne = jest.fn().mockResolvedValue({ id: 'h1', title: 'Mine' });
    const { app, token } = await buildApp({ highlights: { findOne } });

    const r = await request(app.getHttpServer())
      .get('/stories/highlights/h1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(findOne).toHaveBeenCalledWith('h1', 'user-1');
    await app.close();
  });

  it('returns 401 when the viewer is not the highlight owner', async () => {
    const findOne = jest.fn().mockRejectedValue(new UnauthorizedException());
    const { app, token } = await buildApp({ highlights: { findOne } });

    const r = await request(app.getHttpServer())
      .get('/stories/highlights/h1')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 404 for a missing highlight', async () => {
    const findOne = jest.fn().mockRejectedValue(new NotFoundException('Highlight not found'));
    const { app, token } = await buildApp({ highlights: { findOne } });

    const r = await request(app.getHttpServer())
      .get('/stories/highlights/missing')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('GET /users/:username/highlights', () => {
  it('forwards the username and caller to the visibility-scoped list', async () => {
    const findForUser = jest.fn().mockResolvedValue([{ id: 'h1', title: 'Best' }]);
    const { app, token } = await buildApp({ highlights: { findForUser } });

    const r = await request(app.getHttpServer())
      .get('/users/bob/highlights')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(findForUser).toHaveBeenCalledWith('bob', 'user-1');
    expect(r.body).toEqual([{ id: 'h1', title: 'Best' }]);
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();

    const r = await request(app.getHttpServer()).get('/users/bob/highlights');

    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 404 for an unknown username', async () => {
    const findForUser = jest.fn().mockRejectedValue(new NotFoundException('User not found'));
    const { app, token } = await buildApp({ highlights: { findForUser } });

    const r = await request(app.getHttpServer())
      .get('/users/ghost/highlights')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('POST /stories/:id/elements/:elementId/poll-vote', () => {
  it('returns 201 and forwards the vote', async () => {
    const vote = jest.fn().mockResolvedValue({ optionCounts: [1, 2], totalVotes: 3, myVote: 1 });
    const { app, token } = await buildApp({ poll: { vote } });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/elements/el-1/poll-vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ optionIndex: 1 });

    expect(r.status).toBe(201);
    expect(vote).toHaveBeenCalledWith('story-1', 'el-1', 'user-1', 1);
    expect(r.body).toEqual({ optionCounts: [1, 2], totalVotes: 3, myVote: 1 });
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/elements/el-1/poll-vote')
      .send({ optionIndex: 0 });

    expect(r.status).toBe(401);
    await app.close();
  });

  it('returns 400 when optionIndex is missing', async () => {
    const vote = jest.fn();
    const { app, token } = await buildApp({ poll: { vote } });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/elements/el-1/poll-vote')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(r.status).toBe(400);
    expect(vote).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns 400 for a negative optionIndex', async () => {
    const vote = jest.fn();
    const { app, token } = await buildApp({ poll: { vote } });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/elements/el-1/poll-vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ optionIndex: -1 });

    expect(r.status).toBe(400);
    expect(vote).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns 400 for a non-integer optionIndex', async () => {
    const vote = jest.fn();
    const { app, token } = await buildApp({ poll: { vote } });

    const r = await request(app.getHttpServer())
      .post('/stories/story-1/elements/el-1/poll-vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ optionIndex: 1.5 });

    expect(r.status).toBe(400);
    expect(vote).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /stories/:id/elements/:elementId/poll-results', () => {
  it('returns 200 and forwards the caller', async () => {
    const getResults = jest
      .fn()
      .mockResolvedValue({ optionCounts: [4, 1], totalVotes: 5, myVote: 0 });
    const { app, token } = await buildApp({ poll: { getResults } });

    const r = await request(app.getHttpServer())
      .get('/stories/story-1/elements/el-1/poll-results')
      .set('Authorization', `Bearer ${token}`);

    expect(r.status).toBe(200);
    expect(getResults).toHaveBeenCalledWith('story-1', 'el-1', 'user-1');
    expect(r.body).toEqual({ optionCounts: [4, 1], totalVotes: 5, myVote: 0 });
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const { app } = await buildApp();

    const r = await request(app.getHttpServer()).get(
      '/stories/story-1/elements/el-1/poll-results'
    );

    expect(r.status).toBe(401);
    await app.close();
  });
});
