/**
 * Admin reports — route wiring and the AdminModule provider registration.
 *
 * `AdminService.getReports/getReport/dismissReport/deletePost` already existed,
 * but `AdminService` was never listed in `AdminModule.providers` and
 * `AdminController` never injected it, so the client's `/admin/reports` and
 * `/admin/posts/:id` calls 404'd.
 *
 * The original gap survived because every existing test builds a *controller-only*
 * module, which cannot see a missing provider. `describe('AdminModule providers')`
 * below asserts the registration directly against the module metadata, so that
 * class of bug fails here instead of at boot. Booting the whole AdminModule graph
 * (Posts → Groups → gateways) is deliberately not done: it hangs the runner.
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';

import { AdminService } from '../src/admin/admin.service';
import { AdminController } from '../src/admin/admin.controller';
import { AdminGuard } from '../src/auth/guards/admin.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { UsersService } from '../src/users/users.service';
import { ReportsService } from '../src/reports/reports.service';
import { PostsService } from '../src/posts/posts.service';
import { ChangelogService } from '../src/admin/changelog.service';
import { SandboxEnvironmentsService } from '../src/admin/sandbox-environments.service';
import { User } from '../src/users/entities/user.entity';
import { LoginSession } from '../src/auth/entities/login-session.entity';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

const ADMIN_ID = '550e8400-e29b-41d4-a716-4466554400dd';
const REPORT_ID = '550e8400-e29b-41d4-a716-4466554400ee';
const POST_ID = '550e8400-e29b-41d4-a716-4466554400ff';

/**
 * `AdminService` used to be absent from `AdminModule.providers`, which is why
 * every report route 404'd. Asserting that registration needs `import
 * { AdminModule }`, and importing it executes the whole app graph
 * (auth → notifications → users → data-export → the ESM-only `archiver`),
 * which jest cannot load. So this is a source-level guard against the
 * registration being dropped again, not a DI boot. The controller tests below
 * supply the *real* AdminService, which does prove AdminController's own
 * dependencies resolve.
 */
describe('AdminModule registers AdminService', () => {
  const source = readFileSync(join(__dirname, '../src/admin/admin.module.ts'), 'utf8');

  it('lists AdminService in providers', () => {
    const providersBlock = source.slice(source.indexOf('providers:'));
    expect(providersBlock).toContain('AdminService');
  });

  it('imports ReportsModule and PostsModule, which AdminService depends on', () => {
    expect(source).toContain('ReportsModule');
    expect(source).toContain('PostsModule');
  });
});

function adminServiceMock(overrides: Record<string, jest.Mock> = {}) {
  return {
    getReports: jest.fn(async () => [{ id: REPORT_ID, reason: 'spam' }]),
    getReport: jest.fn(async () => ({ id: REPORT_ID, reason: 'spam' })),
    dismissReport: jest.fn(async () => undefined),
    deletePost: jest.fn(async () => undefined),
    ...overrides,
  };
}

async function buildApp(opts: { role?: string; service?: any } = {}) {
  // The real AdminService (not a mock) so the controller's constructor
  // dependencies are genuinely exercised; its collaborators are stubbed.
  const service = opts.service;
  const providers: any[] = [
    {
      provide: AdminService,
      useFactory: (reports: any, posts: any) => service ?? new AdminService(reports, posts),
      inject: [ReportsService, PostsService],
    },
    {
      provide: ReportsService,
      useValue: {
        findAll: jest.fn(async () => [{ id: REPORT_ID, reason: 'spam' }]),
        findOne: jest.fn(async () => ({ id: REPORT_ID, reason: 'spam' })),
        remove: jest.fn(async () => undefined),
      },
    },
    {
      provide: PostsService,
      useValue: {
        findOne: jest.fn(async () => ({ id: POST_ID, user: { id: 'someone-else' } })),
        remove: jest.fn(async () => undefined),
      },
    },
    { provide: UsersService, useValue: { findOneById: jest.fn(), ban: jest.fn() } },
    { provide: ChangelogService, useValue: { publish: jest.fn() } },
    {
      provide: SandboxEnvironmentsService,
      useValue: { create: jest.fn(), list: jest.fn(), get: jest.fn(), update: jest.fn(), archive: jest.fn() },
    },
    {
      provide: ConfigService,
      useValue: {
        get: (key: string, def?: any) => {
          if (key === 'JWT_SECRET') return 'test-secret';
          if (key === 'SESSION_IDLE_TIMEOUT_MINUTES') return 0;
          return def;
        },
      },
    },
    {
      provide: getRepositoryToken(LoginSession),
      useValue: {
        findOne: jest.fn().mockResolvedValue({ id: 's1', revokedAt: null, lastSeenAt: new Date() }),
        update: jest.fn(),
      },
    },
    {
      provide: getRepositoryToken(User),
      useValue: { findOne: jest.fn(async ({ where }: any) => ({ id: where.id, role: opts.role ?? 'admin' })) },
    },
    JwtStrategy,
  ];

  const moduleRef = await Test.createTestingModule({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test-secret' })],
    controllers: [AdminController],
    providers,
  }).compile();

  const app: INestApplication = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  // Spy on the real instance so the routes can be asserted without swapping
  // AdminService out for a mock.
  const resolved = app.get(AdminService);
  for (const method of ['getReports', 'getReport', 'dismissReport', 'deletePost'] as const) {
    jest.spyOn(resolved as any, method);
  }

  const token = app.get(JwtService).sign({ sub: ADMIN_ID, sid: 's1' });
  return { app, service: resolved, token };
}

describe('GET /admin/reports', () => {
  it('returns the report list for an admin', async () => {
    const { app, token } = await buildApp();
    const r = await request(app.getHttpServer()).get('/admin/reports').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(1);
    await app.close();
  });

  it('rejects an unauthenticated request', async () => {
    const { app } = await buildApp();
    const r = await request(app.getHttpServer()).get('/admin/reports');
    expect(r.status).toBe(401);
    await app.close();
  });

  it('rejects a non-admin with 403', async () => {
    const { app, token } = await buildApp({ role: 'user' });
    const r = await request(app.getHttpServer()).get('/admin/reports').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(403);
    await app.close();
  });

  it('clamps take to the max page size and forwards skip', async () => {
    const { app, service, token } = await buildApp();
    await request(app.getHttpServer())
      .get('/admin/reports?take=99999&skip=5')
      .set('Authorization', `Bearer ${token}`);
    expect(service.getReports).toHaveBeenCalledWith(100, 5);
    await app.close();
  });

  it('falls back to 0 for a non-numeric take', async () => {
    const { app, service, token } = await buildApp();
    await request(app.getHttpServer())
      .get('/admin/reports?take=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(service.getReports).toHaveBeenCalledWith(0, 0);
    await app.close();
  });

  it('clamps a negative skip to 0', async () => {
    const { app, service, token } = await buildApp();
    await request(app.getHttpServer())
      .get('/admin/reports?skip=-3')
      .set('Authorization', `Bearer ${token}`);
    expect(service.getReports).toHaveBeenCalledWith(0, 0);
    await app.close();
  });
});

describe('GET /admin/reports/:id', () => {
  it('delegates to the service', async () => {
    const { app, service, token } = await buildApp();
    const r = await request(app.getHttpServer())
      .get(`/admin/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(service.getReport).toHaveBeenCalledWith(REPORT_ID);
    await app.close();
  });

  it('surfaces NotFound as a 404', async () => {
    const { app, token } = await buildApp({
      service: adminServiceMock({ getReport: jest.fn(async () => { throw new NotFoundException('Report not found'); }) }),
    });
    const r = await request(app.getHttpServer())
      .get(`/admin/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('DELETE /admin/reports/:id', () => {
  it('returns 204 when an admin dismisses a report', async () => {
    const { app, service, token } = await buildApp();
    const r = await request(app.getHttpServer())
      .delete(`/admin/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(service.dismissReport).toHaveBeenCalledWith(REPORT_ID);
    await app.close();
  });

  it('is forbidden for a non-admin and does not delete', async () => {
    const { app, service, token } = await buildApp({ role: 'user' });
    const r = await request(app.getHttpServer())
      .delete(`/admin/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(403);
    expect(service.dismissReport).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('DELETE /admin/posts/:id', () => {
  it('passes the real admin id, not the literal string "admin"', async () => {
    const { app, service, token } = await buildApp();
    const r = await request(app.getHttpServer())
      .delete(`/admin/posts/${POST_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(204);
    expect(service.deletePost).toHaveBeenCalledWith(POST_ID, ADMIN_ID);
    await app.close();
  });

  it('surfaces NotFound as a 404', async () => {
    const { app, token } = await buildApp({
      service: adminServiceMock({ deletePost: jest.fn(async () => { throw new NotFoundException('Post not found'); }) }),
    });
    const r = await request(app.getHttpServer())
      .delete(`/admin/posts/${POST_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
    await app.close();
  });
});

describe('route guards', () => {
  it('protects the report routes with JwtAuthGuard and AdminGuard', () => {
    const guards = Reflect.getMetadata('__guards__', AdminController.prototype.listReports) as any[];
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(AdminGuard);
  });

  it('protects dismissReport the same way', () => {
    const guards = Reflect.getMetadata('__guards__', AdminController.prototype.dismissReport) as any[];
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(AdminGuard);
  });
});