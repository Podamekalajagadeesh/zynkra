import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticlesService } from './articles.service';
import { Article, ArticleStatus } from './article.entity';
import { User } from '../users/entities/user.entity';

function makeUser(overrides: any = {}) {
  return { id: 'user-1', username: 'author', ...overrides };
}

function makeArticle(overrides: any = {}) {
  return {
    id: 'art-1', slug: 'my-article-123', title: 'My Article', subtitle: 'Subtitle',
    content: 'Article content here', excerpt: 'Article content here',
    status: ArticleStatus.PUBLISHED, author: makeUser(), authorId: 'user-1',
    viewCount: 0, readingTime: 1, tags: ['tech'], coverImage: null,
    publishedAt: new Date(), isGated: false, tokenPrice: null, ...overrides,
  };
}

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepo: jest.Mocked<Repository<Article>>;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), remove: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    articleRepo = module.get(getRepositoryToken(Article));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('creates an article', async () => {
      userRepo.findOne.mockResolvedValue(makeUser() as any);
      articleRepo.save.mockResolvedValue(makeArticle() as any);

      const result = await service.create('user-1', { title: 'My Article', content: 'Content here' });
      expect(result.title).toBe('My Article');
      expect(articleRepo.save).toHaveBeenCalled();
    });

    it('throws when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.create('bad-id', { title: 'X', content: 'Y' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates article title', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle() as any);
      articleRepo.save.mockResolvedValue(makeArticle({ title: 'Updated' }) as any);

      const result = await service.update('art-1', 'user-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('throws when article not found', async () => {
      articleRepo.findOne.mockResolvedValue(null);
      await expect(service.update('missing', 'user-1', {})).rejects.toThrow(NotFoundException);
    });

    it('throws when not author', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle({ author: makeUser({ id: 'other' }) }) as any);
      await expect(service.update('art-1', 'user-1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish', () => {
    it('publishes an article', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle({ status: ArticleStatus.DRAFT }) as any);
      articleRepo.save.mockResolvedValue(makeArticle({ status: ArticleStatus.PUBLISHED }) as any);

      await service.publish('art-1', 'user-1');
      expect(articleRepo.save).toHaveBeenCalled();
    });

    it('throws when not author', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle({ author: makeUser({ id: 'other' }) }) as any);
      await expect(service.publish('art-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('archives an article', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle() as any);
      articleRepo.save.mockResolvedValue(makeArticle({ status: ArticleStatus.ARCHIVED }) as any);

      await service.archive('art-1', 'user-1');
      expect(articleRepo.save).toHaveBeenCalled();
    });
  });

  describe('deleteArticle', () => {
    it('deletes own article', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle() as any);
      articleRepo.remove.mockResolvedValue(makeArticle() as any);

      await service.deleteArticle('art-1', 'user-1');
      expect(articleRepo.remove).toHaveBeenCalled();
    });

    it('throws when not author', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle({ author: makeUser({ id: 'other' }) }) as any);
      await expect(service.deleteArticle('art-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBySlug', () => {
    it('returns article by slug', async () => {
      articleRepo.findOne.mockResolvedValue(makeArticle() as any);
      const result = await service.findBySlug('my-article-123');
      expect(result).toBeDefined();
    });

    it('throws when not found', async () => {
      articleRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeed', () => {
    it('returns paginated articles', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[makeArticle()], 1]),
      };
      articleRepo.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getFeed({ page: 1, limit: 10 });
      expect(result.articles).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
