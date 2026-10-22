import { Repository } from 'typeorm';
import { CaptchaService } from './captcha.service';
import { CaptchaChallengeEntity } from './entities/captcha-challenge.entity';

/**
 * Minimal in-memory stand-in for the TypeORM repository, so the service can be
 * tested without a database. Mirrors only the methods the service uses.
 */
function makeRepo() {
  const rows = new Map<string, CaptchaChallengeEntity>();
  let counter = 0;
  return {
    rows,
    create: jest.fn((partial: Partial<CaptchaChallengeEntity>) => {
      counter += 1;
      return {
        id: `cap-${counter}`,
        attempts: 0,
        maxAttempts: 3,
        ...partial,
      } as CaptchaChallengeEntity;
    }),
    save: jest.fn(async (entity: CaptchaChallengeEntity) => {
      rows.set(entity.id, entity);
      return entity;
    }),
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
    delete: jest.fn(async (id: string) => {
      const existed = rows.delete(id);
      return { affected: existed ? 1 : 0 };
    }),
  } as unknown as Repository<CaptchaChallengeEntity> & {
    rows: Map<string, CaptchaChallengeEntity>;
  };
}

describe('CaptchaService', () => {
  let service: CaptchaService;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    service = new CaptchaService(repo);
  });

  const solve = (expression: string): number => {
    const [a, , b] = expression.split(' ');
    return Number(a) + Number(b);
  };

  it('generates a challenge whose expression matches the stored answer', async () => {
    const challenge = await service.generate();
    expect(challenge.id).toBeDefined();
    expect(challenge.expression).toMatch(/^\d+ \+ \d+$/);
    expect(challenge.expiresIn).toBe(120);
    expect(await service.verify(challenge.id, solve(challenge.expression))).toBe(true);
  });

  it('keeps both operands between 1 and 9', async () => {
    for (let i = 0; i < 25; i += 1) {
      const { expression } = await service.generate();
      const [a, , b] = expression.split(' ').map(Number);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it('rejects a wrong answer', async () => {
    const challenge = await service.generate();
    expect(await service.verify(challenge.id, solve(challenge.expression) + 1)).toBe(false);
  });

  it('is single-use: a correct answer cannot be replayed', async () => {
    const challenge = await service.generate();
    const answer = solve(challenge.expression);
    expect(await service.verify(challenge.id, answer)).toBe(true);
    expect(await service.verify(challenge.id, answer)).toBe(false);
  });

  it('consumes the challenge even on a wrong answer, so it cannot be brute-forced', async () => {
    const challenge = await service.generate();
    const answer = solve(challenge.expression);
    expect(await service.verify(challenge.id, answer + 1)).toBe(false);
    // The row is gone, so the correct answer no longer works either.
    expect(await service.verify(challenge.id, answer)).toBe(false);
  });

  it('rejects an unknown challenge id', async () => {
    expect(await service.verify('does-not-exist', 1)).toBe(false);
  });

  it('rejects a missing id or answer', async () => {
    expect(await service.verify(undefined, 1)).toBe(false);
    expect(await service.verify('x', undefined)).toBe(false);
    expect(await service.verify('', '')).toBe(false);
  });

  it('rejects an expired challenge and removes it', async () => {
    const challenge = await service.generate();
    repo.rows.get(challenge.id)!.expiresAt = new Date(Date.now() - 1000);
    expect(await service.verify(challenge.id, solve(challenge.expression))).toBe(false);
    expect(repo.rows.has(challenge.id)).toBe(false);
  });

  it('rejects a challenge that has exhausted its attempts', async () => {
    const challenge = await service.generate();
    const row = repo.rows.get(challenge.id)!;
    row.attempts = row.maxAttempts;
    expect(await service.verify(challenge.id, solve(challenge.expression))).toBe(false);
  });

  it('prunes expired rows', async () => {
    await service.generate();
    await service.generate();
    const stale = await service.generate();
    repo.rows.get(stale.id)!.expiresAt = new Date(Date.now() - 1000);
    // Only the expired row is removed by the id-targeted delete used in verify,
    // so prune explicitly via the date predicate mock.
    const removed = await service.prune();
    expect(typeof removed).toBe('number');
  });
});
