import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReelsService } from './reels.service';
import { ReelEffect } from './entities/reel-effect.entity';
import { Post, PostType, PostVisibility } from '../posts/entities/post.entity';
import { Media } from '../media/entities/media.entity';

function makeUser(overrides: any = {}) {
  return { id: 'user-1', username: 'testuser', ...overrides };
}

function makePost(overrides: any = {}) {
  return {
    id: 'post-1', postType: PostType.REEL, content: 'Cool reel',
    visibility: PostVisibility.PUBLIC, user: makeUser(),
    viewCount: 0, shareCount: 0, reactions: [], comments: [],
    reelEffect: null, media: [], ...overrides,
  };
}

describe('ReelsService', () => {
  let service: ReelsService;
  let postRepo: jest.Mocked<Repository<Post>>;
  let reelEffectRepo: jest.Mocked<Repository<ReelEffect>>;
  let mediaRepo: jest.Mocked<Repository<Media>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReelsService,
        { provide: getRepositoryToken(Post), useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), remove: jest.fn(), increment: jest.fn() } },
        { provide: getRepositoryToken(ReelEffect), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: getRepositoryToken(Media), useValue: { findOne: jest.fn(), save: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReelsService>(ReelsService);
    postRepo = module.get(getRepositoryToken(Post));
    reelEffectRepo = module.get(getRepositoryToken(ReelEffect));
    mediaRepo = module.get(getRepositoryToken(Media));
  });

  describe('getReelById', () => {
    it('returns a reel by id', async () => {
      postRepo.findOne.mockResolvedValue(makePost() as any);
      const result = await service.getReelById('post-1');
      expect(result).toBeDefined();
    });

    it('throws when reel not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.getReelById('missing')).rejects.toThrow();
    });
  });

  describe('getReelSuggestions', () => {
    it('returns reels sorted by engagement', async () => {
      const posts = [
        { ...makePost(), reactions: [{ id: 'r1' }], comments: [] },
        { ...makePost({ id: 'post-2' }), reactions: [{ id: 'r2' }, { id: 'r3' }], comments: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }] },
      ];
      postRepo.find.mockResolvedValue(posts as any);

      const result = await service.getReelSuggestions(makeUser({ id: 'other' }));
      expect(result).toHaveLength(2);
    });

    it('filters out user own posts', async () => {
      const posts = [
        { ...makePost(), reactions: [], comments: [] }, // own post
      ];
      postRepo.find.mockResolvedValue(posts as any);

      const result = await service.getReelSuggestions(makeUser({ id: 'user-1' }));
      expect(result).toHaveLength(0);
    });
  });

  describe('shareReel', () => {
    it('increments share count', async () => {
      await service.shareReel('post-1');
      expect(postRepo.increment).toHaveBeenCalledWith({ id: 'post-1' }, 'shareCount', 1);
    });
  });

  describe('trackView', () => {
    it('increments view count', async () => {
      await service.trackView('post-1');
      expect(postRepo.increment).toHaveBeenCalledWith({ id: 'post-1' }, 'viewCount', 1);
    });
  });

  describe('getReelInsights', () => {
    it('returns insights for reel owner', async () => {
      const post = { ...makePost(), reactions: [{ id: 'r1' }], comments: [{ id: 'c1' }] };
      postRepo.findOne.mockResolvedValue(post as any);

      const result = await service.getReelInsights('post-1', makeUser());
      expect(result.likeCount).toBe(1);
      expect(result.commentCount).toBe(1);
    });

    it('throws when not authorized', async () => {
      const post = makePost({ user: makeUser({ id: 'other' }) });
      postRepo.findOne.mockResolvedValue(post as any);

      await expect(service.getReelInsights('post-1', makeUser())).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReel', () => {
    it('creates a reel', async () => {
      mediaRepo.findOne.mockResolvedValue({ id: 'media-1' } as any);
      mediaRepo.save.mockResolvedValue({ id: 'media-1' } as any);
      postRepo.create.mockReturnValue(makePost() as any);
      postRepo.save.mockResolvedValue(makePost() as any);

      const result = await service.createReel({ mediaId: 'media-1', content: 'My reel' } as any, makeUser());
      expect(postRepo.save).toHaveBeenCalled();
    });

    it('throws when media not found', async () => {
      mediaRepo.findOne.mockResolvedValue(null);
      await expect(service.createReel({ mediaId: 'missing' } as any, makeUser())).rejects.toThrow(NotFoundException);
    });

    it('creates reel with effect', async () => {
      mediaRepo.findOne.mockResolvedValue({ id: 'media-1' } as any);
      mediaRepo.save.mockResolvedValue({} as any);
      reelEffectRepo.findOne.mockResolvedValue({ id: 'effect-1' } as any);
      postRepo.create.mockReturnValue(makePost() as any);
      postRepo.save.mockResolvedValue(makePost() as any);

      await service.createReel({ mediaId: 'media-1', effectId: 'effect-1', content: 'With effect' } as any, makeUser());
      expect(postRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateReel', () => {
    it('updates reel content', async () => {
      const reel = makePost({ user: makeUser() });
      postRepo.findOne.mockResolvedValue(reel as any);
      postRepo.save.mockResolvedValue({ ...reel, content: 'Updated' } as any);

      const result = await service.updateReel('post-1', { content: 'Updated' } as any, makeUser());
      expect(postRepo.save).toHaveBeenCalled();
    });

    it('throws when reel not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.updateReel('missing', {} as any, makeUser())).rejects.toThrow(NotFoundException);
    });

    it('throws when not authorized', async () => {
      const reel = makePost({ user: makeUser({ id: 'other' }) });
      postRepo.findOne.mockResolvedValue(reel as any);

      await expect(service.updateReel('post-1', {} as any, makeUser())).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteReel', () => {
    it('deletes reel when owner', async () => {
      const reel = makePost({ user: makeUser() });
      postRepo.findOne.mockResolvedValue(reel as any);
      postRepo.remove.mockResolvedValue(reel as any);

      await service.deleteReel('post-1', makeUser());
      expect(postRepo.remove).toHaveBeenCalled();
    });

    it('throws when not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteReel('missing', makeUser())).rejects.toThrow(NotFoundException);
    });

    it('throws when not authorized', async () => {
      postRepo.findOne.mockResolvedValue(makePost({ user: makeUser({ id: 'other' }) }) as any);
      await expect(service.deleteReel('post-1', makeUser())).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('reel effects', () => {
    it('getReelEffects returns all effects', async () => {
      reelEffectRepo.find.mockResolvedValue([{ id: 'e1', name: 'Neon' }] as any);
      const result = await service.getReelEffects();
      expect(result).toHaveLength(1);
    });

    it('createReelEffect creates an effect', async () => {
      reelEffectRepo.create.mockReturnValue({ id: 'e1' } as any);
      reelEffectRepo.save.mockResolvedValue({ id: 'e1' } as any);

      await service.createReelEffect({ name: 'Neon', type: 'color' } as any);
      expect(reelEffectRepo.save).toHaveBeenCalled();
    });

    it('deleteReelEffect throws when not found', async () => {
      reelEffectRepo.delete.mockResolvedValue({ affected: 0 } as any);
      await expect(service.deleteReelEffect('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
