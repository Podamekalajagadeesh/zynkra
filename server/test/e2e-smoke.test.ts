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

describe('E2E smoke workflow', () => {
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

  it('serves the mobile feed and accepts a post creation request', async () => {
    const feedResponse = await request(app.getHttpServer()).get('/mobile/feed');
    expect(feedResponse.status).toBe(200);
    expect(feedResponse.body[0]).toHaveProperty('id');

    const createResponse = await request(app.getHttpServer())
      .post('/mobile/posts')
      .send({ content: 'End-to-end smoke test', author: 'E2E', handle: '@e2e' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.content).toBe('End-to-end smoke test');
  });
});
