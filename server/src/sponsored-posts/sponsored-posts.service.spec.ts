import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SponsoredPostsService } from './sponsored-posts.service';
import { SponsoredPost } from './entities/sponsored-post.entity';

function makeSponsoredPost(overrides: Partial<SponsoredPost> = {}): SponsoredPost {
  const post = new SponsoredPost();
  Object.assign(post, {
    id: 'sp-1',
    sponsor: { id: 'user-1' },
    post: { id: 'post-1' },
    budget: 100,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  });
  return post;
}

describe('SponsoredPostsService', () => {
  let service: SponsoredPostsService;
  let repo: jest.Mocked<Repository<SponsoredPost>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsoredPostsService,
        {
          provide: getRepositoryToken(SponsoredPost),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SponsoredPostsService>(SponsoredPostsService);
    repo = module.get(getRepositoryToken(SponsoredPost));
  });

  describe('create', () => {
    it('creates a sponsored post', async () => {
      const sponsor = { id: 'user-1' } as any;
      const post = { id: 'post-1' } as any;
      const budget = 200;
      const expiresAt = new Date(Date.now() + 86400000);

      repo.create.mockReturnValue(makeSponsoredPost({ budget }));
      repo.save.mockResolvedValue(makeSponsoredPost({ budget }));

      const result = await service.create(sponsor, post, budget, expiresAt);

      expect(repo.create).toHaveBeenCalledWith({ sponsor, post, budget, expiresAt });
      expect(result.budget).toBe(200);
    });
  });

  describe('getActiveSponsoredPosts', () => {
    it('returns active sponsored posts', async () => {
      const posts = [makeSponsoredPost(), makeSponsoredPost({ id: 'sp-2' })];
      repo.find.mockResolvedValue(posts);

      const result = await service.getActiveSponsoredPosts();

      expect(result).toHaveLength(2);
      expect(repo.find).toHaveBeenCalledWith({
        where: { expiresAt: expect.any(Object) },
        relations: ['post', 'post.user', 'post.likes', 'post.comments', 'post.tags'],
      });
    });

    it('returns empty when no active posts', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.getActiveSponsoredPosts();

      expect(result).toHaveLength(0);
    });

    it('only returns posts that have not expired', async () => {
      repo.find.mockResolvedValue([]);

      await service.getActiveSponsoredPosts();

      const callArg = repo.find.mock.calls[0][0] as any;
      expect(callArg.where.expiresAt).toBeInstanceOf(Object);
    });
  });
});
