import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { MediaService } from './media.service';
import { Media } from './entities/media.entity';

function makeMedia(overrides: Partial<Media> = {}): Media {
  const media = new Media();
  Object.assign(media, {
    id: 'media-1',
    url: '/uploads/images/abc123.jpg',
    type: 'image',
    altText: 'photo.jpg',
    sortOrder: 0,
    userId: 'user-1',
    ...overrides,
  });
  return media;
}

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    // A real 1x1 PNG: sharp validates image payloads before reading metadata.
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    ),
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  } as Express.Multer.File;
}

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<Repository<Media>>;
  let uploadRoot: string;

  beforeEach(async () => {
    uploadRoot = mkdtempSync(join(tmpdir(), 'zynkra-media-'));

    mediaRepo = {
      create: jest.fn((input) => ({ ...input, id: 'new-id' })),
      save: jest.fn(async (entity) => ({ ...entity, id: entity.id || 'new-id' })),
      findOne: jest.fn(),
      remove: jest.fn(async (entity) => entity),
    } as unknown as jest.Mocked<Repository<Media>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => {
              if (key === 'UPLOAD_DIR') return uploadRoot;
              if (key === 'CDN_BASE_URL') return process.env.CDN_BASE_URL_TEST || '';
              return fallback;
            },
          },
        },
        { provide: getRepositoryToken(Media), useValue: mediaRepo },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  afterEach(() => {
    rmSync(uploadRoot, { recursive: true, force: true });
    delete process.env.CDN_BASE_URL_TEST;
  });

  describe('uploadFile', () => {
    it('stores the file under the type subdirectory and records ownership', async () => {
      const file = makeFile();
      const result = await service.uploadFile(file, { userId: 'user-1' });

      expect(result.url).toMatch(/^\/uploads\/images\/[a-f0-9]+\.jpg$/);
      expect(result.type).toBe('image');
      expect(result.id).toBe('new-id');

      const rel = result.url.replace('/uploads/', '');
      expect(existsSync(join(uploadRoot, rel))).toBe(true);
      expect(readFileSync(join(uploadRoot, rel))).toEqual(file.buffer);

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: result.url,
          type: 'image',
          userId: 'user-1',
          altText: 'photo.jpg',
        })
      );
      expect(mediaRepo.save).toHaveBeenCalled();
    });

    it('rejects unsupported mimetypes', async () => {
      const file = makeFile({ mimetype: 'application/pdf', originalname: 'a.pdf' });
      await expect(service.uploadFile(file, { userId: 'user-1' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('rejects files over the image size limit', async () => {
      const file = makeFile({ size: 11 * 1024 * 1024 });
      await expect(service.uploadFile(file, { userId: 'user-1' })).rejects.toThrow(/too large/i);
    });

    it('prefixes absolute URLs with CDN_BASE_URL when configured', async () => {
      process.env.CDN_BASE_URL_TEST = 'https://cdn.example.com/';
      // Rebuild service so config is re-read with the test CDN value.
      const module = await Test.createTestingModule({
        providers: [
          MediaService,
          {
            provide: ConfigService,
            useValue: {
              get: (key: string, fallback?: unknown) => {
                if (key === 'UPLOAD_DIR') return uploadRoot;
                if (key === 'CDN_BASE_URL') return 'https://cdn.example.com/';
                return fallback;
              },
            },
          },
          { provide: getRepositoryToken(Media), useValue: mediaRepo },
        ],
      }).compile();
      const cdnService = module.get(MediaService);

      const result = await cdnService.uploadFile(makeFile(), { userId: 'user-1' });
      expect(result.url).toMatch(/^https:\/\/cdn\.example\.com\/uploads\/images\//);
    });
  });

  describe('deleteMedia', () => {
    it('deletes the file and row when the caller owns the media', async () => {
      const file = makeFile();
      const uploadResult = await service.uploadFile(file, { userId: 'user-1' });
      const storedPath = join(uploadRoot, uploadResult.url.replace('/uploads/', ''));
      expect(existsSync(storedPath)).toBe(true);

      mediaRepo.findOne.mockResolvedValueOnce(
        makeMedia({ id: uploadResult.id, url: uploadResult.url, userId: 'user-1' })
      );

      await service.deleteMedia(uploadResult.id, 'user-1');

      expect(existsSync(storedPath)).toBe(false);
      expect(mediaRepo.remove).toHaveBeenCalled();
    });

    it('rejects when the caller does not own the media', async () => {
      mediaRepo.findOne.mockResolvedValueOnce(makeMedia({ userId: 'owner-user' }));

      await expect(service.deleteMedia('media-1', 'intruder')).rejects.toThrow(ForbiddenException);
      expect(mediaRepo.remove).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated delete of owned media', async () => {
      mediaRepo.findOne.mockResolvedValueOnce(makeMedia({ userId: 'owner-user' }));

      await expect(service.deleteMedia('media-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFound for missing media', async () => {
      mediaRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.deleteMedia('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('refuses to unlink paths outside the upload root', async () => {
      mediaRepo.findOne.mockResolvedValueOnce(
        makeMedia({ url: '/uploads/../../etc/passwd', userId: 'user-1' })
      );

      // Path resolution throws BadRequest; row must not be left half-deleted
      // with a successful unlink of an external file.
      await expect(service.deleteMedia('media-1', 'user-1')).rejects.toThrow(BadRequestException);
      expect(mediaRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('findOwnedByUrl', () => {
    it('looks up media by url and owner', async () => {
      const row = makeMedia();
      mediaRepo.findOne.mockResolvedValueOnce(row);

      const found = await service.findOwnedByUrl('/uploads/images/abc123.jpg', 'user-1');
      expect(found).toBe(row);
      expect(mediaRepo.findOne).toHaveBeenCalledWith({
        where: { url: '/uploads/images/abc123.jpg', userId: 'user-1' },
      });
    });
  });
});
