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

async function buildApp(env: Record<string, string> = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AppController],
    providers: [
      {
        provide: ConfigService,
        useValue: new ConfigService(env),
      },
      {
        provide: AuthService,
        useValue: new DummyAuthService(),
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('QA smoke API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp({ MOBILE_DEMO_ENDPOINTS_ENABLED: 'true' });
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

  it('rejects a mobile post with no content', async () => {
    const response = await request(app.getHttpServer()).post('/mobile/posts').send({});

    expect(response.status).toBe(400);
  });
});

describe('mobile demo endpoints are disabled by default', () => {
  // Regression: /mobile/feed served a hardcoded array and /mobile/posts accepted
  // an UNAUTHENTICATED write, both reachable in production. They are now gated
  // behind MOBILE_DEMO_ENDPOINTS_ENABLED, which defaults to off.
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not expose the feed when the flag is unset', async () => {
    const response = await request(app.getHttpServer()).get('/mobile/feed');
    expect(response.status).toBe(404);
  });

  it('does not accept unauthenticated writes when the flag is unset', async () => {
    const response = await request(app.getHttpServer())
      .post('/mobile/posts')
      .send({ content: 'should not be accepted', author: 'Attacker', handle: '@attacker' });

    expect(response.status).toBe(404);
  });

  it('still serves the health check regardless of the flag', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
