/**
 * Wave 6 promotion, Groups Workspace — real-database behavior of the
 * GroupsWorkspaceIntegrity migration (unique indexes, FK rewrite, indexes)
 * proven against a REAL Postgres instance (embedded-postgres), no mocks.
 *
 * Method: let TypeORM `synchronize` build the pristine schema from the
 * entities (this is what a fresh environment gets), then run the migration's
 * `up()` directly — never the whole chain: the chain ends with a baseline-on-
 * empty assumption that is unproven for fresh databases. Assert behavior;
 * run `down()`; assert the original policy is restored; run `up()` again and
 * assert re-apply + dedupe.
 *
 * One live-only table has no entity: `dao`. The migration redefines its FK
 * because that FK exists in the live database (names were read from
 * pg_constraint there), so synchronize never creates it — a minimal stub
 * provides the FK surface the migration expects.
 *
 * Run with: npm run test:groups-db
 */

process.env.NODE_ENV = 'test';
process.env.DB_MIGRATIONS_RUN = 'false';

jest.setTimeout(180_000);

import { DataSource, QueryRunner } from 'typeorm';
import { join, sep } from 'path';
import { readdirSync } from 'fs';
import { tmpdir } from 'os';

import { GroupsWorkspaceIntegrity1794100000000 } from '../src/migrations/1794100000000-GroupsWorkspaceIntegrity';

/** Same full-schema walk as core-loop.db.integration.test.ts (see there for
 *  why autoLoadEntities cannot work: User's relation graph reaches ~60 types
 *  across modules a focused test does not import). */
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

const PG_PORT = 55433;
const PG_USER = 'postgres';
const PG_PASSWORD = 'postgres';
const PG_DATABASE = 'zynkra_groups_test';

let dataSource: DataSource;
let queryRunner: QueryRunner;
let embeddedPg: any = null;

// embedded-postgres is ESM-only, our ts-jest target is CommonJS: run a real
// dynamic import through Function so the runtime import expression survives.
const dynamicImport = new Function('specifier', 'return import(specifier)');

async function startEmbeddedPostgres(): Promise<void> {
  const embedded = (await dynamicImport('embedded-postgres')) as any;
  const EmbeddedPostgres = embedded.EmbeddedPostgres ?? embedded.default;
  if (!EmbeddedPostgres) {
    throw new Error('Could not load EmbeddedPostgres from the embedded-postgres package.');
  }
  embeddedPg = new EmbeddedPostgres({
    databaseDir: join(tmpdir(), `zynkra-groups-embedded-pg-${process.pid}`),
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

const migration = new GroupsWorkspaceIntegrity1794100000000();

beforeAll(async () => {
  await startEmbeddedPostgres();
  dataSource = new DataSource({
    type: 'postgres',
    host: '127.0.0.1',
    port: PG_PORT,
    username: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
    entities: collectEntityFiles(),
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();
  // The live-only `dao` table (no entity): FK target surface for up()/down().
  await dataSource.query(
    `CREATE TABLE IF NOT EXISTS "dao" ("id" uuid NOT NULL PRIMARY KEY, "groupId" uuid)`
  );
  queryRunner = dataSource.createQueryRunner();
  await migration.up(queryRunner);
});

afterAll(async () => {
  if (queryRunner) await queryRunner.release().catch(() => undefined);
  if (dataSource) await dataSource.destroy().catch(() => undefined);
  if (embeddedPg) await embeddedPg.stop().catch(() => undefined);
});

// --- helpers -----------------------------------------------------------------

async function insertUser(tag: string): Promise<string> {
  const rows = await dataSource.query(
    `INSERT INTO "users" ("username", "email") VALUES ($1, $2) RETURNING "id"`,
    [tag, `${tag}@groups-db.test`]
  );
  return rows[0].id as string;
}

async function insertGroup(name: string, ownerId?: string): Promise<string> {
  const rows = ownerId
    ? await dataSource.query(
        `INSERT INTO "groups" ("name", "ownerId") VALUES ($1, $2) RETURNING "id"`,
        [name, ownerId]
      )
    : await dataSource.query(`INSERT INTO "groups" ("name") VALUES ($1) RETURNING "id"`, [name]);
  return rows[0].id as string;
}

async function insertChannel(name: string, groupId: string): Promise<string> {
  const rows = await dataSource.query(
    `INSERT INTO "channels" ("name", "groupId") VALUES ($1, $2) RETURNING "id"`,
    [name, groupId]
  );
  return rows[0].id as string;
}

async function count(query: string, params: unknown[] = []): Promise<number> {
  const rows = await dataSource.query(query, params);
  return Number(rows[0].count ?? rows[0].cnt ?? Object.values(rows[0])[0]);
}

interface FkRow {
  confdeltype: string;
  confupdtype: string;
}

async function fksOn(table: string, column: string): Promise<FkRow[]> {
  return dataSource.query(
    `SELECT con.confdeltype, con.confupdtype
       FROM pg_constraint con
       JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
      WHERE con.conrelid = $1::regclass AND con.contype = 'f' AND a.attname = $2`,
    [`"${table}"`, column]
  );
}

async function indexExists(name: string): Promise<boolean> {
  const rows = await dataSource.query(
    `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1`,
    [name]
  );
  return rows.length === 1;
}

async function expectSqlError(fn: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await fn();
  } catch (err) {
    expect((err as { code?: string }).code).toBe(code);
    return;
  }
  throw new Error(`expected the query to fail with SQLSTATE ${code}`);
}

const UNIQUE_INDEXES = [
  'UQ_group_members_user_group',
  'UQ_channel_members_channel_user',
  'UQ_vote_proposal_voter',
  'UQ_challenge_contributions_participation',
];

const FK_INDEXES: Array<[string, string]> = [
  ['group_members', 'userId'],
  ['group_members', 'groupId'],
  ['channels', 'groupId'],
  ['channel_members', 'channelId'],
  ['channel_members', 'userId'],
  ['message', 'channelId'],
  ['message', 'conversationId'],
  ['message', 'senderId'],
  ['conversation', 'groupId'],
  ['conversation', 'modmailRecipientId'],
  ['proposal', 'groupId'],
  ['vote', 'proposalId'],
  ['vote', 'voterId'],
  ['todo_items', 'groupId'],
  ['todo_items', 'assigneeId'],
  ['calendar_events', 'groupId'],
  ['community_challenges', 'groupId'],
  ['challenge_contributions', 'challengeId'],
  ['group_lockdowns', 'groupId'],
];

/** Every FK the migration rewrites, with its intended ON DELETE policy
 *  (c = CASCADE, n = SET NULL). Exactly one constraint must exist per pair —
 *  a second row here would mean the migration's DROP missed a renamed
 *  constraint and left a duplicate FK behind. */
const EXPECTED_FKS: Array<[string, string, string]> = [
  ['group_members', 'groupId', 'c'],
  ['channels', 'groupId', 'c'],
  ['proposal', 'groupId', 'c'],
  ['community_challenges', 'groupId', 'c'],
  ['calendar_events', 'groupId', 'c'],
  ['todo_items', 'groupId', 'c'],
  ['conversation', 'groupId', 'c'],
  ['dao', 'groupId', 'c'],
  ['group_lockdowns', 'groupId', 'c'],
  ['group_members', 'userId', 'c'],
  ['channel_members', 'userId', 'c'],
  ['channel_members', 'channelId', 'c'],
  ['vote', 'voterId', 'c'],
  ['message', 'senderId', 'c'],
  ['conversation_participants_users', 'usersId', 'c'],
  ['vote', 'proposalId', 'c'],
  ['challenge_contributions', 'challengeId', 'c'],
  ['message', 'channelId', 'c'],
  ['message', 'conversationId', 'c'],
  ['conversation', 'ownerId', 'c'],
  ['groups', 'ownerId', 'n'],
  ['proposal', 'creatorId', 'n'],
  ['calendar_events', 'creatorId', 'n'],
  ['todo_items', 'creatorId', 'n'],
  ['todo_items', 'assigneeId', 'n'],
  ['community_challenges', 'creatorId', 'n'],
  ['challenge_contributions', 'userId', 'n'],
  ['group_lockdowns', 'createdById', 'n'],
  ['conversation', 'modmailRecipientId', 'n'],
  ['message', 'replyToId', 'n'],
  ['message', 'forwardedFromId', 'n'],
];

// --- assertions --------------------------------------------------------------

describe('GroupsWorkspaceIntegrity migration on a live Postgres', () => {
  it('creates the four partial unique indexes and every FK/join index', async () => {
    for (const name of UNIQUE_INDEXES) {
      expect(await indexExists(name)).toBe(true);
    }
    for (const [table, column] of FK_INDEXES) {
      expect(await indexExists(`IDX_${table}_${column}`)).toBe(true);
    }
  });

  it('applies exactly one FK per migrated pair with the intended delete policy', async () => {
    for (const [table, column, policy] of EXPECTED_FKS) {
      const rows = await fksOn(table, column);
      expect({
        at: `${table}.${column}`,
        count: rows.length,
        policy: rows[0]?.confdeltype,
      }).toEqual({ at: `${table}.${column}`, count: 1, policy });
    }
    // The junction FK keeps its historical ON UPDATE CASCADE.
    const junction = await fksOn('conversation_participants_users', 'usersId');
    expect(junction[0].confupdtype).toBe('c');
  });

  it('rejects duplicate membership rows with SQLSTATE 23505', async () => {
    const user = await insertUser('dup-user');
    const group = await insertGroup('dup-group');
    const channel = await insertChannel('dup-channel', group);

    await dataSource.query(`INSERT INTO "group_members" ("userId", "groupId") VALUES ($1, $2)`, [
      user,
      group,
    ]);
    await expectSqlError(
      () =>
        dataSource.query(`INSERT INTO "group_members" ("userId", "groupId") VALUES ($1, $2)`, [
          user,
          group,
        ]),
      '23505'
    );

    await dataSource.query(
      `INSERT INTO "channel_members" ("channelId", "userId") VALUES ($1, $2)`,
      [channel, user]
    );
    await expectSqlError(
      () =>
        dataSource.query(`INSERT INTO "channel_members" ("channelId", "userId") VALUES ($1, $2)`, [
          channel,
          user,
        ]),
      '23505'
    );
  });

  it('cascades every child table when a group is deleted', async () => {
    const owner = await insertUser('cascade-owner');
    const group = await insertGroup('cascade-group', owner);
    const channel = await insertChannel('cascade-channel', group);

    await dataSource.query(`INSERT INTO "group_members" ("userId", "groupId") VALUES ($1, $2)`, [
      owner,
      group,
    ]);
    await dataSource.query(
      `INSERT INTO "proposal" ("title", "description", "groupId", "creatorId") VALUES ($1, $2, $3, $4)`,
      ['p', 'd', group, owner]
    );
    await dataSource.query(
      `INSERT INTO "calendar_events" ("title", "startTime", "endTime", "groupId", "creatorId") VALUES ($1, now(), now(), $2, $3)`,
      ['e', group, owner]
    );
    await dataSource.query(
      `INSERT INTO "todo_items" ("title", "groupId", "creatorId") VALUES ($1, $2, $3)`,
      ['t', group, owner]
    );
    await dataSource.query(`INSERT INTO "conversation" ("groupId") VALUES ($1)`, [group]);
    await dataSource.query(
      `INSERT INTO "group_lockdowns" ("groupId", "createdById") VALUES ($1, $2)`,
      [group, owner]
    );
    await dataSource.query(
      `INSERT INTO "community_challenges" ("title", "description", "type", "groupId", "creatorId") VALUES ($1, $2, 'group_goal', $3, $4)`,
      ['c', 'd', group, owner]
    );

    await dataSource.query(`DELETE FROM "groups" WHERE "id" = $1`, [group]);

    for (const [table, column] of [
      ['group_members', 'groupId'],
      ['channels', 'groupId'],
      ['proposal', 'groupId'],
      ['calendar_events', 'groupId'],
      ['todo_items', 'groupId'],
      ['conversation', 'groupId'],
      ['group_lockdowns', 'groupId'],
      ['community_challenges', 'groupId'],
    ] as const) {
      expect({
        at: `${table}.${column}`,
        n: await count(`SELECT count(*)::int AS count FROM "${table}" WHERE "${column}" = $1`, [
          group,
        ]),
      }).toEqual({
        at: `${table}.${column}`,
        n: 0,
      });
    }
    expect(
      await count(`SELECT count(*)::int AS count FROM "channels" WHERE "id" = $1`, [channel])
    ).toBe(0);
  });

  it('deleting a user applies the identity/content mix of policies', async () => {
    const userB = await insertUser('delete-user-b');
    const group = await insertGroup('user-delete-group', userB);
    const channel = await insertChannel('user-delete-channel', group);

    await dataSource.query(`INSERT INTO "group_members" ("userId", "groupId") VALUES ($1, $2)`, [
      userB,
      group,
    ]);
    await dataSource.query(
      `INSERT INTO "message" ("content", "senderId", "channelId") VALUES ($1, $2, $3)`,
      ['hello', userB, channel]
    );
    await dataSource.query(
      `INSERT INTO "proposal" ("title", "description", "groupId", "creatorId") VALUES ($1, $2, $3, $4)`,
      ['p', 'd', group, userB]
    );
    const proposalId = (
      await dataSource.query(`SELECT "id" FROM "proposal" WHERE "creatorId" = $1`, [userB])
    )[0].id as string;
    await dataSource.query(
      `INSERT INTO "vote" ("proposalId", "voterId", "choice") VALUES ($1, $2, true)`,
      [proposalId, userB]
    );
    await dataSource.query(
      `INSERT INTO "todo_items" ("title", "groupId", "creatorId", "assigneeId") VALUES ($1, $2, $3, $4)`,
      ['t', group, userB, userB]
    );
    await dataSource.query(
      `INSERT INTO "group_lockdowns" ("groupId", "createdById") VALUES ($1, $2)`,
      [group, userB]
    );
    await dataSource.query(`INSERT INTO "conversation" ("groupId", "ownerId") VALUES ($1, $2)`, [
      group,
      userB,
    ]);

    await dataSource.query(`DELETE FROM "users" WHERE "id" = $1`, [userB]);

    // identity rows die with the owner:
    expect(
      await count(`SELECT count(*)::int AS count FROM "group_members" WHERE "userId" = $1`, [userB])
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int AS count FROM "message" WHERE "senderId" = $1`, [userB])
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int AS count FROM "vote" WHERE "voterId" = $1`, [userB])
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int AS count FROM "conversation" WHERE "ownerId" = $1`, [userB])
    ).toBe(0);
    // content survives with the person nulled:
    const todo = (
      await dataSource.query(
        `SELECT "creatorId", "assigneeId" FROM "todo_items" WHERE "groupId" = $1`,
        [group]
      )
    )[0];
    expect(todo.creatorId).toBeNull();
    expect(todo.assigneeId).toBeNull();
    const proposal = (
      await dataSource.query(`SELECT "creatorId" FROM "proposal" WHERE "groupId" = $1`, [group])
    )[0];
    expect(proposal.creatorId).toBeNull();
    const groupRow = (
      await dataSource.query(`SELECT "ownerId" FROM "groups" WHERE "id" = $1`, [group])
    )[0];
    expect(groupRow.ownerId).toBeNull();
    const lockdown = (
      await dataSource.query(`SELECT "createdById" FROM "group_lockdowns" WHERE "groupId" = $1`, [
        group,
      ])
    )[0];
    expect(lockdown.createdById).toBeNull();
  });

  it('nulls replies when the replied-to message is deleted', async () => {
    const user = await insertUser('reply-user');
    const group = await insertGroup('reply-group');
    const channel = await insertChannel('reply-channel', group);
    await dataSource
      .query(
        `INSERT INTO "message" ("content", "senderId", "channelId") VALUES ($1, $2, $3) RETURNING "id"`,
        ['first', user, channel]
      )
      .then(async (rows) => {
        const firstId = rows[0].id as string;
        await dataSource.query(
          `INSERT INTO "message" ("content", "senderId", "channelId", "replyToId") VALUES ($1, $2, $3, $4)`,
          ['second', user, channel, firstId]
        );
        await dataSource.query(`DELETE FROM "message" WHERE "id" = $1`, [firstId]);
      });

    const second = (
      await dataSource.query(`SELECT "replyToId" FROM "message" WHERE "content" = $1`, ['second'])
    )[0];
    expect(second.replyToId).toBeNull();
  });

  it('down() restores NO ACTION, drops the unique indexes, and allows duplicates again', async () => {
    await migration.down(queryRunner);

    for (const name of UNIQUE_INDEXES) {
      expect(await indexExists(name)).toBe(false);
    }
    expect(await indexExists('IDX_group_members_groupId')).toBe(false);

    const groupMembers = await fksOn('group_members', 'groupId');
    expect(groupMembers).toHaveLength(1);
    expect(groupMembers[0].confdeltype).toBe('a');
    const channels = await fksOn('channels', 'groupId');
    expect(channels[0].confdeltype).toBe('a');
    // down() restores the lockdown FK to its live original (CASCADE), not NO ACTION.
    const lockdown = await fksOn('group_lockdowns', 'groupId');
    expect(lockdown[0].confdeltype).toBe('c');

    const user = await insertUser('down-user');
    const group = await insertGroup('down-group');
    await dataSource.query(`INSERT INTO "group_members" ("userId", "groupId") VALUES ($1, $2)`, [
      user,
      group,
    ]);
    await dataSource.query(`INSERT INTO "group_members" ("userId", "groupId") VALUES ($1, $2)`, [
      user,
      group,
    ]);
    expect(
      await count(`SELECT count(*)::int AS count FROM "group_members" WHERE "userId" = $1`, [user])
    ).toBe(2);
  });

  it('up() re-applies everything: dedupes the leftover rows and restores indexes/policies', async () => {
    await migration.up(queryRunner);

    expect(
      await count(
        `SELECT count(*)::int AS count FROM "group_members" WHERE "userId" = (SELECT "id" FROM "users" WHERE "username" = 'down-user')`
      )
    ).toBe(1);

    for (const name of UNIQUE_INDEXES) {
      expect(await indexExists(name)).toBe(true);
    }
    expect(await indexExists('IDX_group_members_groupId')).toBe(true);

    for (const [table, column, policy] of EXPECTED_FKS) {
      const rows = await fksOn(table, column);
      expect({
        at: `${table}.${column}`,
        count: rows.length,
        policy: rows[0]?.confdeltype,
      }).toEqual({
        at: `${table}.${column}`,
        count: 1,
        policy,
      });
    }

    const downUser = (
      await dataSource.query(`SELECT "id" FROM "users" WHERE "username" = 'down-user'`)
    )[0].id as string;
    const downGroup = (
      await dataSource.query(`SELECT "id" FROM "groups" WHERE "name" = 'down-group'`)
    )[0].id as string;
    await expectSqlError(
      () =>
        dataSource.query(`INSERT INTO "group_members" ("userId", "groupId") VALUES ($1, $2)`, [
          downUser,
          downGroup,
        ]),
      '23505'
    );
  });
});
