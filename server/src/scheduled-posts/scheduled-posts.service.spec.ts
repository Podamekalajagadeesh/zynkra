import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledPostsService } from './scheduled-posts.service';
import { ScheduledPost } from './entities/scheduled-post.entity';
import { PostsService } from '../posts/posts.service';

function makeScheduled(overrides: Partial<ScheduledPost> = {}): ScheduledPost {
  const post = new ScheduledPost();
  Object.assign(post, {
    id: 'sp-1',
    userId: 'user-1',
    content: 'Scheduled content',
    mediaUrl: null,
    postType: 'feed',
    scheduledFor: new Date(Date.now() + 60_000),
    isOptimalTime: false,
    status: 'scheduled',
    visibility: null,
    crossPlatformIds: null,
    crossPlatformStatus: null,
    createdAt: new Date(),
    publishedAt: null,
    ...overrides,
  });
  return post;
}

describe('ScheduledPostsService', () => {
  let service: ScheduledPostsService;
  let repo: jest.Mocked<Repository<ScheduledPost>>;
  let postsService: jest.Mocked<Pick<PostsService, 'create'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledPostsService,
        {
          provide: getRepositoryToken(ScheduledPost),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: PostsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ScheduledPostsService>(ScheduledPostsService);
    repo = module.get(getRepositoryToken(ScheduledPost));
    postsService = module.get(PostsService);
  });

  describe('create', () => {
    it('creates a scheduled post with the given time', async () => {
      repo.create.mockReturnValue(makeScheduled({ scheduledFor: new Date('2030-01-01') }));
      repo.save.mockResolvedValue(makeScheduled({ scheduledFor: new Date('2030-01-01') }));

      const result = await service.create('user-1', {
        content: 'Hello',
        scheduledFor: '2030-01-01T00:00:00.000Z',
      });

      expect(result.status).toBe('scheduled');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', content: 'Hello', status: 'scheduled' }),
      );
    });

    it('defaults to one hour out when no time is provided', async () => {
      repo.create.mockImplementation((partial) => makeScheduled(partial as Partial<ScheduledPost>));
      repo.save.mockImplementation(async (post: any) => post as ScheduledPost);

      const before = Date.now();
      const result = await service.create('user-1', { content: 'Hello' });
      const after = Date.now();

      expect(result.scheduledFor.getTime()).toBeGreaterThanOrEqual(before + 3_600_000 - 1000);
      expect(result.scheduledFor.getTime()).toBeLessThanOrEqual(after + 3_600_000 + 1000);
    });
  });

  describe('findAll / update / cancel', () => {
    it('lists only the owner’s scheduled posts', async () => {
      repo.find.mockResolvedValue([makeScheduled()]);

      await service.findAll('user-1');

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('forbids updating another user’s scheduled post', async () => {
      repo.findOne.mockResolvedValue(makeScheduled({ userId: 'owner-1' }));

      await expect(service.update('user-1', 'sp-1', { content: 'x' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the scheduled post is missing', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.cancel('user-1', 'sp-1')).rejects.toThrow(NotFoundException);
    });

    it('cancels (removes) the owner’s scheduled post', async () => {
      repo.findOne.mockResolvedValue(makeScheduled());
      repo.remove.mockResolvedValue(makeScheduled());

      await service.cancel('user-1', 'sp-1');

      expect(repo.remove).toHaveBeenCalled();
    });
  });

  describe('publishDue', () => {
    it('publishes due posts via PostsService and marks them published', async () => {
      const due = makeScheduled({ status: 'scheduled' as const });
      repo.find.mockResolvedValue([due]);
      postsService.create.mockResolvedValue({ id: "post-1" } as any);
      repo.save.mockImplementation(async (post: any) => post as ScheduledPost);

      await service.publishDue();

      expect(postsService.create).toHaveBeenCalledWith(
        { userId: 'user-1' },
        expect.objectContaining({ content: 'Scheduled content', postType: 'post', visibility: 'public' }),
      );
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
    });

    it('normalizes "feed" postType to "post" when publishing', async () => {
      const due = makeScheduled({ status: 'scheduled' as const, postType: 'feed' });
      repo.find.mockResolvedValue([due]);
      postsService.create.mockResolvedValue({ id: "post-1" } as any);
      repo.save.mockImplementation(async (post: any) => post as ScheduledPost);

      await service.publishDue();

      const [, dto] = postsService.create.mock.calls[0] as [{ userId: string }, Record<string, unknown>];
      expect(dto.postType).toBe('post');
    });

    it('marks a post as failed when publishing throws', async () => {
      const due = makeScheduled({ status: 'scheduled' as const });
      repo.find.mockResolvedValue([due]);
      postsService.create.mockRejectedValue(new Error('boom'));
      repo.save.mockImplementation(async (post: any) => post as ScheduledPost);

      await service.publishDue();

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    });
  });
});
