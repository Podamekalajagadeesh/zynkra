/**
 * Integration tests for the media upload pipeline (local disk backend).
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import sharp from 'sharp';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { MediaController } from '../src/media/media.controller';
import { MediaService } from '../src/media/media.service';
import { Media } from '../src/media/entities/media.entity';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { User } from '../src/users/entities/user.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

describe('Media upload pipeline (integration)', () => {
  let app: INestApplication;
  let uploadRoot: string;
  let token: string;
  let realJpeg: Buffer;

  beforeAll(async () => {
    uploadRoot = mkdtempSync(join(tmpdir(), 'zynkra-media-it-'));
    // sharp is a declared dependency and rejects fake bytes with a 500, so
    // generate a real (tiny) JPEG instead of a hand-rolled base64 stub.
    realJpeg = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .jpeg()
      .toBuffer();

    const mediaRepo = {
      create: jest.fn((input) => ({ ...input, id: 'new-id' })),
      save: jest.fn(async (entity) => ({
        ...entity,
        id: entity.id || 'media-1',
      })),
      findOne: jest.fn(),
      remove: jest.fn(async (entity) => entity),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'test-secret' }),
      ],
      controllers: [MediaController],
      providers: [
        MediaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => {
              if (key === 'UPLOAD_DIR') return uploadRoot;
              if (key === 'CDN_BASE_URL') return '';
              if (key === 'JWT_SECRET') return 'test-secret';
              return fallback;
            },
          },
        },
        { provide: getRepositoryToken(Media), useValue: mediaRepo },
        {
          provide: getRepositoryToken(LoginSession),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null }),
            update: jest.fn(),
          },
        },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user-1@test.com', status: 'active', banned: false, role: 'user' }) } },
        JwtStrategy,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    token = app.get(JwtService).sign({ sub: 'user-1', sid: 's1' });
  });

  afterAll(async () => {
    await app?.close();
    rmSync(uploadRoot, { recursive: true, force: true });
  });

  it('POST /media/upload stores an image and returns a public URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', realJpeg, {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/images\//);
    expect(res.body.type).toBe('image');
    expect(res.body.id).toBeTruthy();

    const rel = res.body.url.replace('/uploads/', '');
    expect(existsSync(join(uploadRoot, rel))).toBe(true);
  });

  it('rejects non-media mimetypes on POST /media/upload', async () => {
    const res = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
  });

  it('requires auth on POST /media/upload', async () => {
    const res = await request(app.getHttpServer())
      .post('/media/upload')
      .attach('file', Buffer.from('x'), {
        filename: 'a.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(401);
  });

  it('POST /media/upload/image processes with sharp when available', async () => {
    // sharp is a declared dependency, so a real image must process to 201.
    const res = await request(app.getHttpServer())
      .post('/media/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', realJpeg, {
        filename: 'tiny.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/images\//);
  });

  it('POST /media/upload rejects missing file', async () => {
    const res = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('DELETE /media/:id enforces ownership', async () => {
    // Seed: service.uploadFile creates a row owned by user-1
    const uploadRes = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', realJpeg, {
        filename: 'x.jpg',
        contentType: 'image/jpeg',
      });
    expect(uploadRes.status).toBe(201);
    const mediaId = uploadRes.body.id;

    // findOne is mocked — return owned media for delete
    const findOne = (
      app.get(getRepositoryToken(Media)) as any
    ).findOne as jest.Mock;
    findOne.mockResolvedValueOnce({
      id: mediaId,
      url: uploadRes.body.url,
      type: 'image',
      userId: 'user-1',
    });

    const del = await request(app.getHttpServer())
      .delete(`/media/${mediaId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });
});
