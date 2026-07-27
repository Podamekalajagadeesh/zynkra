import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from './entities/bookmark.entity';
import { Post } from '../posts/entities/post.entity';
import { Collection } from './entities/collection.entity';
import { UserInterestsService } from '../user-interests/user-interests.service';

function makeBookmark(overrides: any = {}) {
  return { id: 'bm-1', user: { id: 'user-1' }, post: { id: 'post-1', tags: [] }, collection: null, createdAt: new Date(), ...overrides };
}

function makePost(overrides: any = {}) {
  return { id: 'post-1', user: { id: 'author-1' }, tags: [], content: 'Hello', ...overrides };
}

function makeCollection(overrides: any = {}) {
  return { id: 'col-1', name: 'My Collection', user: { id: 'user-1' }, ...overrides };
}

describe('BookmarksService', () => {
  let service: BookmarksService;
  let bookmarkRepo: jest.Mocked<Repository<Bookmark>>;
  let postRepo: jest.Mocked<Repository<Post>>;
  let collectionRepo: jest.Mocked<Repository<Collection>>;
  let userInterestsService: jest.Mocked<UserInterestsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: getRepositoryToken(Bookmark), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() } },
        { provide: getRepositoryToken(Post), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Collection), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() } },
        { provide: UserInterestsService, useValue: { recordInteraction: jest.fn() } },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
    bookmarkRepo = module.get(getRepositoryToken(Bookmark));
    postRepo = module.get(getRepositoryToken(Post));
    collectionRepo = module.get(getRepositoryToken(Collection));
    userInterestsService = module.get(UserInterestsService);
  });

  // ─── Bookmark create ──────────────────────────────────────────────────

  describe('create bookmark', () => {
    it('creates a bookmark for a post', async () => {
      postRepo.findOne.mockResolvedValue(makePost());
      bookmarkRepo.create.mockReturnValue(makeBookmark());
      bookmarkRepo.save.mockResolvedValue(makeBookmark());

      const result = await service.create({ postId: 'post-1' } as any, { id: 'user-1' } as any);
      expect(result).toBeDefined();
      expect(bookmarkRepo.create).toHaveBeenCalled();
    });

    it('throws NotFoundException when post not found', async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.create({ postId: 'missing' } as any, { id: 'user-1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('validates collection belongs to user when collectionId provided', async () => {
      postRepo.findOne.mockResolvedValue(makePost());
      collectionRepo.findOne.mockResolvedValue(makeCollection());
      bookmarkRepo.create.mockReturnValue(makeBookmark());
      bookmarkRepo.save.mockResolvedValue(makeBookmark());

      await service.create({ postId: 'post-1', collectionId: 'col-1' } as any, { id: 'user-1' } as any);
      expect(collectionRepo.findOne).toHaveBeenCalled();
    });

    it('throws NotFoundException when collection not found', async () => {
      postRepo.findOne.mockResolvedValue(makePost());
      collectionRepo.findOne.mockResolvedValue(null);

      await expect(service.create({ postId: 'post-1', collectionId: 'missing' } as any, { id: 'user-1' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Bookmark findAll ──────────────────────────────────────────────────

  describe('findAll bookmarks', () => {
    it('returns all bookmarks for user', async () => {
      bookmarkRepo.find.mockResolvedValue([makeBookmark(), makeBookmark({ id: 'bm-2' })]);

      const result = await service.findAll({ id: 'user-1' } as any);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no bookmarks', async () => {
      bookmarkRepo.find.mockResolvedValue([]);

      const result = await service.findAll({ id: 'user-1' } as any);
      expect(result).toHaveLength(0);
    });
  });

  // ─── Bookmark remove ──────────────────────────────────────────────────

  describe('remove bookmark', () => {
    it('removes a bookmark', async () => {
      const bm = makeBookmark();
      bookmarkRepo.findOne.mockResolvedValue(bm);
      bookmarkRepo.remove.mockResolvedValue(bm);

      await service.remove('post-1', { id: 'user-1' } as any);
      expect(bookmarkRepo.remove).toHaveBeenCalledWith(bm);
    });

    it('throws NotFoundException when bookmark not found', async () => {
      bookmarkRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('missing', { id: 'user-1' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Collection create ────────────────────────────────────────────────

  describe('createCollection', () => {
    it('creates a collection', async () => {
      collectionRepo.create.mockReturnValue(makeCollection());
      collectionRepo.save.mockResolvedValue(makeCollection());

      const result = await service.createCollection({ name: 'Favorites' } as any, 'user-1');
      expect(result.name).toBe('My Collection');
    });
  });

  // ─── Collection findAll ───────────────────────────────────────────────

  describe('findAllCollections', () => {
    it('returns all collections for user', async () => {
      collectionRepo.find.mockResolvedValue([makeCollection()]);

      const result = await service.findAllCollections('user-1');
      expect(result).toHaveLength(1);
    });
  });

  // ─── Collection findOne ───────────────────────────────────────────────

  describe('findOneCollection', () => {
    it('returns a collection with bookmarks', async () => {
      collectionRepo.findOne.mockResolvedValue(makeCollection({ bookmarks: [makeBookmark()] }));

      const result = await service.findOneCollection('col-1', 'user-1');
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when collection not found', async () => {
      collectionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneCollection('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Collection update ────────────────────────────────────────────────

  describe('updateCollection', () => {
    it('updates collection name', async () => {
      const col = makeCollection();
      collectionRepo.findOne.mockResolvedValue(col);
      collectionRepo.save.mockResolvedValue(col);

      await service.updateCollection('col-1', { name: 'Renamed' } as any, 'user-1');
      expect(col.name).toBe('Renamed');
      expect(collectionRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when not found', async () => {
      collectionRepo.findOne.mockResolvedValue(null);
      await expect(service.updateCollection('missing', { name: 'X' } as any, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Collection remove ────────────────────────────────────────────────

  describe('removeCollection', () => {
    it('removes a collection', async () => {
      const col = makeCollection();
      collectionRepo.findOne.mockResolvedValue(col);
      collectionRepo.remove.mockResolvedValue(col);

      await service.removeCollection('col-1', 'user-1');
      expect(collectionRepo.remove).toHaveBeenCalledWith(col);
    });

    it('throws NotFoundException when not found', async () => {
      collectionRepo.findOne.mockResolvedValue(null);
      await expect(service.removeCollection('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
