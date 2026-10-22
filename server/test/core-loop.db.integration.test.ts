/**
 * Phase 1 exit criterion, real-DB variant of core-loop.integration.test.ts:
 * signup → profile → post → feed → follow → comment → react → DM → notify
 * driven over HTTP against the REAL service modules and a REAL Postgres
 * instance (embedded-postgres), no mocks at the repository/DB boundary.
 *
 * Get a pristine schema by letting TypeORM `synchronize` build it from the
 * imported entities; the base auth config only needs JWT_SECRET/SESSION_SECRET.
 *
 * Run with: npm run test:core-db
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-only-jwt-secret-0123456789abcdef0123456789abcdef';
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || 'test-only-session-secret-0123456789abcdef0123456789abcdef';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '55432';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'zynkra_test';
process.env.DB_MIGRATIONS_RUN = 'false';

jest.setTimeout(120_000);

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { join, sep } from 'path';
import { readdirSync } from 'fs';
import { tmpdir } from 'os';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { PostsModule } from '../src/posts/posts.module';
import { FeedModule } from '../src/feed/feed.module';
import { CommentsModule } from '../src/comments/comments.module';
import { ReactionsModule } from '../src/reactions/reactions.module';
import { DmsModule } from '../src/dms/dms.module';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { CommonModule } from '../src/common/common.module';
import { VisibilityModule } from '../src/common/visibility/visibility.module';
import { StoriesModule } from '../src/stories/stories.module';

import { User } from '../src/users/entities/user.entity';
import { Post } from '../src/posts/entities/post.entity';
import { Comment } from '../src/comments/entities/comment.entity';
import { Notification, NotificationType } from '../src/notifications/entities/notification.entity';
import { Conversation } from '../src/dms/entities/conversation.entity';
import { Message } from '../src/dms/entities/message.entity';

/**
 * Every @Entity class in src/ except the `src/features/verification` facade:
 * those five files duplicate the real `verification_requests` /
 * `verification_appeals` tables (with a `varchar` requestId against the real
 * uuid one) while being registered nowhere in app.module.ts — loading them
 * makes TypeORM's synchronize abort with a FK type mismatch. Everything else
 * must be present: User's relation graph reaches most of the schema, and
 * account-management under src/features/ IS wired into the real app.
 */
function collectEntityFiles(): string[] {
  const entities: string[] = [];
  const skip = `${join(__dirname, '..', 'src', 'features', 'verification')}${sep}`;
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full.startsWith(skip)) continue;
        walk(full);
      } else if (entry.name.endsWith('.entity.ts')) {
        entities.push(full);
      }
    }
  };
  walk(join(__dirname, '..', 'src'));
  return entities;
}

const PG_PORT = 55432;
const PG_USER = 'postgres';
const PG_PASSWORD = 'postgres';
const PG_DATABASE = 'zynkra_test';
const PASSWORD = 'Str0ng!Pass2026';

let app: INestApplication;
let moduleFixture: TestingModule;
let dataSource: DataSource;
let embeddedPg: any = null;

// embedded-postgres is ESM-only, and our ts-jest target is CommonJS, so a
// static import() would be rewritten to require() (ERR_REQUIRE_ESM). Run a real
// dynamic import through Function to keep the runtime import expression intact.
const dynamicImport = new Function('specifier', 'return import(specifier)');

async function startEmbeddedPostgres(): Promise<void> {
  const embedded = (await dynamicImport('embedded-postgres')) as any;
  const EmbeddedPostgres = embedded.EmbeddedPostgres ?? embedded.default;
  if (!EmbeddedPostgres) {
    throw new Error(
      'Could not load EmbeddedPostgres from the embedded-postgres package. ' +
        'Is @embedded-postgres/linux-x64 installed with its build script allowed?'
    );
  }

  embeddedPg = new EmbeddedPostgres({
    databaseDir: join(tmpdir(), `zynkra-embedded-pg-${process.pid}`),
    user: PG_USER,
    password: PG_PASSWORD,
    port: PG_PORT,
    persistent: false,
  });

  await embeddedPg.initialise();
  await embeddedPg.start();
  try {
    await embeddedPg.createDatabase(PG_DATABASE);
  } catch {
    await embeddedPg.dropDatabase(PG_DATABASE).catch(() => undefined);
    await embeddedPg.createDatabase(PG_DATABASE);
  }
}

beforeAll(async () => {
  await startEmbeddedPostgres();

  moduleFixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: '127.0.0.1',
        port: PG_PORT,
        username: PG_USER,
        password: PG_PASSWORD,
        database: PG_DATABASE,
        // Full schema, not just the entities of the eight imported modules:
        // `autoLoadEntities` alone cannot work here — User's relation graph
        // reaches ~60 entity types (Badge, MarketplaceListing, DatingProfile,
        // UserGift, …) whose owning modules this focused test does not
        // import, and TypeORM refuses to build metadata with dangling
        // relation targets ("Entity metadata for Comment#awards was not
        // found"). collectEntityFiles() walks the full src/ tree.
        entities: collectEntityFiles(),
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
        retryAttempts: 10,
        retryDelay: 500,
      }),
      // @Global() shared providers (WsAuthService etc.) — AppModule imports it
      // for exactly this reason, and without it the module graph under test
      // cannot resolve globally-provided services.
      CommonModule,
      // The other @Global() module; AppModule imports both, DmsService etc.
      // inject VisibilityService assuming global availability.
      VisibilityModule,
      NotificationsModule,
      UsersModule,
      AuthModule,
      PostsModule,
      FeedModule,
      CommentsModule,
      ReactionsModule,
      DmsModule,
      StoriesModule,
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  dataSource = moduleFixture.get(DataSource);
});

afterAll(async () => {
  if (app) {
    await app.close().catch(() => undefined);
  }
  if (embeddedPg) {
    await embeddedPg.stop().catch(() => undefined);
  }
});

describe('Full core loop over real Postgres', () => {
  it('walks signup → profile → post → feed → follow → comment → react → DM → notify', async () => {
    const http = () => request(app.getHttpServer());
    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

    const usersRepo = dataSource.getRepository(User);
    const postsRepo = dataSource.getRepository(Post);
    const commentsRepo = dataSource.getRepository(Comment);
    const notificationsRepo = dataSource.getRepository(Notification);
    const conversationsRepo = dataSource.getRepository(Conversation);
    const messagesRepo = dataSource.getRepository(Message);

    async function solveCaptcha() {
      const res = await http().get('/auth/captcha').expect(200);
      const { id, expression } = res.body;
      const parts = String(expression)
        .split(' + ')
        .map((s: string) => parseInt(s.trim(), 10));
      expect(parts.length).toBe(2);
      return { id, answer: String(parts[0] + parts[1]) };
    }

    async function signupUser(username: string, email: string) {
      const captcha = await solveCaptcha();
      const signup = await http()
        .post('/auth/signup')
        .send({
          username,
          email,
          password: PASSWORD,
          birthDate: '2000-01-01',
          captchaId: captcha.id,
          captchaAnswer: captcha.answer,
        })
        .expect(201);
      expect(signup.body.message).toBeTruthy();

      const user = await usersRepo.findOneByOrFail({ username });
      const code = user.emailVerificationToken;
      expect(code).toBeTruthy();

      const verify = await http().post('/auth/verify-code').send({ email, code }).expect(200);
      expect(verify.body.access_token).toBeTruthy();

      return { id: user.id, token: verify.body.access_token, username, email };
    }

    const user1 = await signupUser('coreloop_user1', 'coreloop1@example.com');
    const user2 = await signupUser('coreloop_user2', 'coreloop2@example.com');
    expect(user1.id).not.toBe(user2.id);

    // ── profile ──────────────────────────────────────────────────────────
    await http()
      .patch('/users/me')
      .set(bearer(user1.token))
      .send({
        displayName: 'Core Loop Tester',
        bio: 'Exercising the real database.',
        location: 'Testville',
      })
      .expect(200);
    const freshUser1 = await usersRepo.findOneByOrFail({ id: user1.id });
    expect(freshUser1.displayName).toBe('Core Loop Tester');

    // ── post ─────────────────────────────────────────────────────────────
    const postRes = await http()
      .post('/posts')
      .set(bearer(user1.token))
      .send({ content: 'Hello from the real Postgres core loop.' })
      .expect(201);
    const postId = postRes.body.id;
    expect(postId).toBeTruthy();
    expect(postRes.body.content).toBe('Hello from the real Postgres core loop.');

    // ── feed ─────────────────────────────────────────────────────────────
    const feedRes = await http().get('/feed/chronological').set(bearer(user1.token)).expect(200);
    const feedBody = feedRes.body;
    const feedItems = Array.isArray(feedBody)
      ? feedBody
      : Array.isArray(feedBody?.data)
        ? feedBody.data
        : Array.isArray(feedBody?.posts)
          ? feedBody.posts
          : Array.isArray(feedBody?.items)
            ? feedBody.items
            : [];
    expect(feedItems.some((p: any) => p.id === postId)).toBe(true);

    // ── follow ───────────────────────────────────────────────────────────
    await http().post(`/users/${user2.id}/follow`).set(bearer(user1.token)).expect(204);
    const followRows = await dataSource.query('SELECT COUNT(*) AS c FROM follows');
    expect(Number(followRows[0]?.c ?? followRows[0]?.count)).toBe(1);

    // ── comment ──────────────────────────────────────────────────────────
    const commentRes = await http()
      .post(`/posts/${postId}/comments`)
      .set(bearer(user2.token))
      .send({ content: 'Nice post!' })
      .expect(201);
    expect(commentRes.body.id).toBeTruthy();

    // ── react ────────────────────────────────────────────────────────────
    await http()
      .post(`/posts/${postId}/react`)
      .set(bearer(user2.token))
      .send({ reaction: 'like' })
      .expect(201);

    // ── direct messages ──────────────────────────────────────────────────
    // Messages require the messages data permission, which is not in the
    // default set (profile/posts/settings). Grant it directly here rather
    // than relaying on an (unverified) account-permissions API route.
    await dataSource.query(
      `UPDATE "users" SET "accountDataPermissions" = '["profile","posts","settings","messages"]'::jsonb WHERE id IN ($1, $2)`,
      [user1.id, user2.id]
    );

    const convoRes = await http()
      .post('/dms/conversations')
      .set(bearer(user1.token))
      .send({ recipientIds: [user2.id] })
      .expect(201);
    expect(convoRes.body.id).toBeTruthy();

    const msgRes = await http()
      .post(`/dms/${convoRes.body.id}/messages`)
      .set(bearer(user1.token))
      .send({ content: 'Direct message over the wire.' })
      .expect(201);
    expect(msgRes.body.id).toBeTruthy();

    // ── notifications ────────────────────────────────────────────────────
    const notifsRes = await http().get('/notifications').set(bearer(user1.token)).expect(200);
    const notifList = Array.isArray(notifsRes.body) ? notifsRes.body : (notifsRes.body?.data ?? []);
    const notifTypes = notifList.map((n: any) => n.type);

    expect(notifTypes).toContain(NotificationType.LOGIN_ALERT);
    expect(notifTypes).toContain(NotificationType.COMMENT);

    const commentNotif = notifList.find((n: any) => n.type === NotificationType.COMMENT);
    expect(commentNotif).toBeTruthy();
    expect(commentNotif.read).toBe(false);

    const beforeUnread = await http()
      .get('/notifications/unread-count')
      .set(bearer(user1.token))
      .expect(200);
    const beforeCount = Number(beforeUnread.body?.count ?? beforeUnread.body);

    await http()
      .patch(`/notifications/${commentNotif.id}/read`)
      .set(bearer(user1.token))
      .expect(200);

    const afterUnread = await http()
      .get('/notifications/unread-count')
      .set(bearer(user1.token))
      .expect(200);
    const afterCount = Number(afterUnread.body?.count ?? afterUnread.body);
    expect(afterCount).toBe(beforeCount - 1);

    // ── direct SQL sanity checks ─────────────────────────────────────────
    expect(await postsRepo.count()).toBe(1);
    expect(await commentsRepo.count()).toBe(1);
    expect(await conversationsRepo.count()).toBe(1);
    expect(await messagesRepo.count()).toBe(1);

    const allNotifications = await notificationsRepo.find();
    const persistedTypes = allNotifications.map((n: Notification) => n.type);
    expect(persistedTypes).toContain(NotificationType.LOGIN_ALERT);
    expect(persistedTypes).toContain(NotificationType.COMMENT);
    expect(persistedTypes).toContain(NotificationType.FOLLOW);
  });
});

describe('Story elements lifecycle over real Postgres', () => {
  it('creates DB-uuid elements, round-trips them over GET /stories, and cascades on delete', async () => {
    const http = () => request(app.getHttpServer());
    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    interface WireStory {
      id: string;
      elements: Array<{ id: string; type: string; data: unknown }>;
    }

    const captchaRes = await http().get('/auth/captcha').expect(200);
    const { id: captchaId, expression } = captchaRes.body;
    const [a, b] = String(expression)
      .split(' + ')
      .map((part: string) => parseInt(part.trim(), 10));
    await http()
      .post('/auth/signup')
      .send({
        username: 'storyelem_user1',
        email: 'storyelem1@example.com',
        password: PASSWORD,
        birthDate: '2000-01-01',
        captchaId,
        captchaAnswer: String(a + b),
      })
      .expect(201);

    const user = await dataSource
      .getRepository(User)
      .findOneByOrFail({ username: 'storyelem_user1' });
    const verify = await http()
      .post('/auth/verify-code')
      .send({ email: 'storyelem1@example.com', code: user.emailVerificationToken })
      .expect(200);
    const token: string = verify.body.access_token;
    expect(token).toBeTruthy();

    const wireElements = [
      { type: 'poll', data: { question: 'Best?', options: ['a', 'b'] } },
      { type: 'mention', data: { username: 'friend' } },
      { type: 'countdown', data: { label: 'Launch', target: '2026-11-01T00:00:00Z' } },
      { type: 'sticker', data: { stickerId: 'party-1' } },
    ];

    const createRes = await http()
      .post('/stories')
      .set(bearer(token))
      .field('textContent', 'elements lifecycle')
      .field('elements', JSON.stringify(wireElements))
      .expect(201);
    const created = createRes.body as WireStory;
    expect(created.id).toBeTruthy();

    // DB assigned every UUID; the client sent none.
    const createdIds = created.elements.map((element) => element.id);
    expect(createdIds).toHaveLength(4);
    for (const id of createdIds) {
      expect(id).toMatch(UUID_RE);
    }
    expect(new Set(createdIds).size).toBe(4);
    expect(created.elements.map((element) => element.type)).toEqual([
      'poll',
      'mention',
      'countdown',
      'sticker',
    ]);

    // GET /stories round-trips the persisted rows (ids, types, data).
    const listRes = await http().get('/stories').set(bearer(token)).expect(200);
    const listed = (listRes.body as WireStory[]).find((story) => story.id === created.id);
    expect(listed).toBeDefined();
    expect(listed!.elements.map((element) => element.id)).toEqual(createdIds);
    expect(listed!.elements[0].data).toEqual(wireElements[0].data);
    expect(listed!.elements[1].data).toEqual(wireElements[1].data);

    // DELETE removes the story and cascades the element rows (FK ON DELETE CASCADE).
    await http().delete(`/stories/${created.id}`).set(bearer(token)).expect(200);
    const afterDelete = await http().get('/stories').set(bearer(token)).expect(200);
    expect((afterDelete.body as WireStory[]).find((story) => story.id === created.id)).toBeUndefined();
    const orphanRows: Array<{ count: number }> = await dataSource.query(
      'SELECT COUNT(*)::int AS count FROM story_elements WHERE "storyId" = $1',
      [created.id]
    );
    expect(orphanRows[0].count).toBe(0);
  });
});

describe('Story children (views, reactions, replies, highlights) over real Postgres', () => {
  it('enforces reaction replace, view privacy, premium anonymity, highlight ownership, and cascade delete', async () => {
    const http = () => request(app.getHttpServer());
    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
    const countIn = async (table: string, storyId: string): Promise<number> => {
      const rows: Array<{ count: number }> = await dataSource.query(
        `SELECT COUNT(*)::int AS count FROM ${table} WHERE "storyId" = $1`,
        [storyId]
      );
      return rows[0].count;
    };
    const signUp = async (username: string, email: string): Promise<string> => {
      const captchaRes = await http().get('/auth/captcha').expect(200);
      const { id: captchaId, expression } = captchaRes.body;
      const [a, b] = String(expression)
        .split(' + ')
        .map((part: string) => parseInt(part.trim(), 10));
      await http()
        .post('/auth/signup')
        .send({
          username,
          email,
          password: PASSWORD,
          birthDate: '2000-01-01',
          captchaId,
          captchaAnswer: String(a + b),
        })
        .expect(201);
      const user = await dataSource.getRepository(User).findOneByOrFail({ username });
      const verify = await http()
        .post('/auth/verify-code')
        .send({ email, code: user.emailVerificationToken })
        .expect(200);
      return verify.body.access_token as string;
    };

    const ownerToken = await signUp('storykids_owner', 'storykids_owner@example.com');
    const viewerToken = await signUp('storykids_viewer', 'storykids_viewer@example.com');
    // New accounts default to storyVisibility 'friends'; make the owner's
    // stories world-viewable so the non-following viewer passes canViewStory.
    await dataSource.query(
      `UPDATE users SET "storyVisibility" = 'public' WHERE username = $1`,
      ['storykids_owner']
    );

    const createRes = await http()
      .post('/stories')
      .set(bearer(ownerToken))
      .field('textContent', 'children lifecycle')
      .expect(201);
    const storyId = createRes.body.id as string;
    expect(storyId).toBeTruthy();

    // ── views: one row per (story, viewer), rewatch updates it in place ──
    await http()
      .post(`/stories/${storyId}/view`)
      .set(bearer(viewerToken))
      .send({ isAnonymous: false })
      .expect(201);
    await http()
      .post(`/stories/${storyId}/view`)
      .set(bearer(viewerToken))
      .send({ isAnonymous: false })
      .expect(201);
    expect(await countIn('story_views', storyId)).toBe(1);

    // Anonymous viewing is premium-only: rejected without an active subscription.
    await http()
      .post(`/stories/${storyId}/view`)
      .set(bearer(viewerToken))
      .send({ isAnonymous: true })
      .expect(403);
    expect(await countIn('story_views', storyId)).toBe(1);

    // Owner sees the viewer; non-owners are rejected.
    const ownerViews = await http()
      .get(`/stories/${storyId}/views`)
      .set(bearer(ownerToken))
      .expect(200);
    expect(ownerViews.body).toHaveLength(1);
    await http().get(`/stories/${storyId}/views`).set(bearer(viewerToken)).expect(401);

    // Anonymized rows are hidden from the owner's list.
    await dataSource.query(`UPDATE story_views SET "isAnonymous" = true WHERE "storyId" = $1`, [
      storyId,
    ]);
    const hiddenViews = await http()
      .get(`/stories/${storyId}/views`)
      .set(bearer(ownerToken))
      .expect(200);
    expect(hiddenViews.body).toHaveLength(0);

    // ── reactions: one row per (story, user); a re-tap replaces ──────────
    await http()
      .post(`/stories/${storyId}/react`)
      .set(bearer(viewerToken))
      .send({ reaction: '👍' })
      .expect(201);
    await http()
      .post(`/stories/${storyId}/react`)
      .set(bearer(viewerToken))
      .send({ reaction: '❤️' })
      .expect(201);
    expect(await countIn('story_reactions', storyId)).toBe(1);
    const reactionRows: Array<{ reaction: string }> = await dataSource.query(
      'SELECT "reaction" FROM story_reactions WHERE "storyId" = $1',
      [storyId]
    );
    expect(reactionRows[0].reaction).toBe('❤️');
    await http()
      .post(`/stories/${storyId}/react`)
      .set(bearer(ownerToken))
      .send({ reaction: '😂' })
      .expect(201);
    expect(await countIn('story_reactions', storyId)).toBe(2);

    // ── replies accumulate ───────────────────────────────────────────────
    await http()
      .post(`/stories/${storyId}/reply`)
      .set(bearer(viewerToken))
      .send({ text: 'First!' })
      .expect(201);
    await http()
      .post(`/stories/${storyId}/reply`)
      .set(bearer(viewerToken))
      .send({ text: 'Second!' })
      .expect(201);
    expect(await countIn('story_replies', storyId)).toBe(2);

    // ── highlights: duplicate storyIds dedupe; reads are owner-only ─────
    const highlightRes = await http()
      .post('/stories/highlights')
      .set(bearer(ownerToken))
      .send({ title: 'Faves', coverUrl: '/covers/f.jpg', storyIds: [storyId, storyId] })
      .expect(201);
    expect(highlightRes.body.stories).toHaveLength(1);
    const highlightId = highlightRes.body.id as string;
    await http().get(`/stories/highlights/${highlightId}`).set(bearer(ownerToken)).expect(200);
    await http().get(`/stories/highlights/${highlightId}`).set(bearer(viewerToken)).expect(401);

    // ── delete: every child table cascades, highlight join rows included ─
    await http().delete(`/stories/${storyId}`).set(bearer(ownerToken)).expect(200);
    expect(await countIn('story_elements', storyId)).toBe(0);
    expect(await countIn('story_views', storyId)).toBe(0);
    expect(await countIn('story_reactions', storyId)).toBe(0);
    expect(await countIn('story_replies', storyId)).toBe(0);
    const joinRows: Array<{ count: number }> = await dataSource.query(
      'SELECT COUNT(*)::int AS count FROM story_highlight_stories WHERE "storyId" = $1',
      [storyId]
    );
    expect(joinRows[0].count).toBe(0);
    const storyRows: Array<{ count: number }> = await dataSource.query(
      'SELECT COUNT(*)::int AS count FROM stories WHERE id = $1',
      [storyId]
    );
    expect(storyRows[0].count).toBe(0);
  });
});
