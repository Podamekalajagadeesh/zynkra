import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppController } from '../src/app.controller';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/auth/auth.service';

class DummyAuthService {
  async verifyEmail() {
    return { ok: true };
  }
}

describe('QA smoke API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ConfigService,
          useValue: new ConfigService(),
        },
        {
          provide: AuthService,
          useValue: new DummyAuthService(),
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the mobile feed payload', async () => {
    const response = await request(app.getHttpServer()).get('/mobile/feed');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('creates a mobile post with valid content', async () => {
    const response = await request(app.getHttpServer())
      .post('/mobile/posts')
      .send({ content: 'Smoke test post', author: 'QA', handle: '@qa' });

    expect(response.status).toBe(201);
    expect(response.body.content).toBe('Smoke test post');
    expect(response.body.author.name).toBe('QA');
  });
});
