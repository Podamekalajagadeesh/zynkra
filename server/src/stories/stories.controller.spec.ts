import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { MediaService } from '../media/media.service';

describe('StoriesController', () => {
  let controller: StoriesController;
  let storiesService: {
    create: jest.Mock;
    findActiveStoriesForUser: jest.Mock;
    trackView: jest.Mock;
    getViews: jest.Mock;
    delete: jest.Mock;
  };
  let mediaService: { uploadFile: jest.Mock };

  beforeEach(async () => {
    storiesService = {
      create: jest.fn(),
      findActiveStoriesForUser: jest.fn(),
      trackView: jest.fn(),
      getViews: jest.fn(),
      delete: jest.fn(),
    };
    mediaService = {
      uploadFile: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoriesController],
      providers: [
        { provide: StoriesService, useValue: storiesService },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    controller = module.get<StoriesController>(StoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const req = { user: { userId: 'u1' } };

    it('creates a story without media and does not touch MediaService', async () => {
      const dto = { content: 'hello' } as never;
      storiesService.create.mockResolvedValue({ id: 's1' });

      await expect(controller.create(undefined, req, dto)).resolves.toEqual({ id: 's1' });
      expect(mediaService.uploadFile).not.toHaveBeenCalled();
      expect(storiesService.create).toHaveBeenCalledWith(dto, 'u1');
    });

    it('stores uploaded media first and pins its URL onto the dto', async () => {
      const file = { mimetype: 'image/png', buffer: Buffer.from('x') } as Express.Multer.File;
      const dto = {} as never;
      mediaService.uploadFile.mockResolvedValue({ url: '/uploads/stories/s1.png' });
      storiesService.create.mockResolvedValue({ id: 's1' });

      await controller.create(file, req, dto);

      expect(mediaService.uploadFile).toHaveBeenCalledWith(file, {
        userId: 'u1',
        subdir: 'stories',
      });
      expect((dto as { mediaUrl?: string }).mediaUrl).toBe('/uploads/stories/s1.png');
      expect(storiesService.create).toHaveBeenCalledWith(dto, 'u1');
    });

    it('parses a JSON-encoded elements string from multipart clients', async () => {
      const dto = {
        elements: '[{"type":"poll","data":{"question":"Best?","options":["a","b"]}}]',
      } as never;
      storiesService.create.mockResolvedValue({ id: 's1' });

      await controller.create(undefined, req, dto);

      expect((dto as { elements?: unknown }).elements).toEqual([
        { type: 'poll', data: { question: 'Best?', options: ['a', 'b'] } },
      ]);
      expect(storiesService.create).toHaveBeenCalledWith(dto, 'u1');
    });

    it('rejects an unparseable elements payload', async () => {
      const dto = { elements: '{not json' } as never;
      await expect(controller.create(undefined, req, dto)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(storiesService.create).not.toHaveBeenCalled();
    });

    it('parses a JSON-encoded backgroundOptions string', async () => {
      const dto = { backgroundOptions: '{"color":"#fff"}' } as never;
      storiesService.create.mockResolvedValue({ id: 's1' });

      await controller.create(undefined, req, dto);

      expect((dto as { backgroundOptions?: unknown }).backgroundOptions).toEqual({ color: '#fff' });
      expect(storiesService.create).toHaveBeenCalledWith(dto, 'u1');
    });
  });

  describe('reads and deletes', () => {
    it('lists active stories for the authenticated user', () => {
      storiesService.findActiveStoriesForUser.mockResolvedValue([{ id: 's1' }]);
      controller.findAll({ user: { userId: 'u1' } });
      expect(storiesService.findActiveStoriesForUser).toHaveBeenCalledWith('u1');
    });

    it('tracks a view as non-anonymous by default', () => {
      controller.trackView('s1', { user: { userId: 'u1' } }, {});
      expect(storiesService.trackView).toHaveBeenCalledWith('s1', 'u1', false);
    });

    it('passes the anonymous flag through when the client sends it', () => {
      controller.trackView('s1', { user: { userId: 'u1' } }, { isAnonymous: true });
      expect(storiesService.trackView).toHaveBeenCalledWith('s1', 'u1', true);
    });

    it('scopes views and deletes to the story owner', () => {
      controller.getViews('s1', { user: { userId: 'u1' } });
      controller.remove('s1', { user: { userId: 'u1' } });
      expect(storiesService.getViews).toHaveBeenCalledWith('s1', 'u1');
      expect(storiesService.delete).toHaveBeenCalledWith('s1', 'u1');
    });
  });
});
