import { InviteCodesService } from './invite-codes.service';
import { InviteCode } from './invite-code.entity';

function makeInvite(overrides: Partial<InviteCode> = {}): InviteCode {
  return {
    id: 'id-1',
    code: 'ABC12345',
    maxUses: 1,
    uses: 0,
    expiresAt: null,
    createdAt: new Date(),
    ...overrides,
  } as InviteCode;
}

function mockRepo() {
  const store = new Map<string, InviteCode>();
  return {
    store,
    findOne: jest.fn(async ({ where }: any) => store.get(where.code) ?? null),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => {
      store.set(data.code, data);
      return data;
    }),
    update: jest.fn(async (id: string, patch: any) => {
      for (const invite of store.values()) {
        if (invite.id === id) Object.assign(invite, patch);
      }
      return { affected: 1 };
    }),
    find: jest.fn(async () => [...store.values()]),
    delete: jest.fn(async (id: string) => {
      for (const [code, invite] of store) {
        if (invite.id === id) store.delete(code);
      }
      return { affected: 1 };
    }),
  };
}

describe('InviteCodesService', () => {
  let service: InviteCodesService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(() => {
    repo = mockRepo();
    service = new InviteCodesService(repo as any);
  });

  it('generates a unique 8-char code', async () => {
    const invite = await service.generateCode('creator-id');
    expect(invite.code).toHaveLength(8);
    expect(invite.maxUses).toBe(1);
    expect(invite.createdById).toBe('creator-id');
  });

  it('honors maxUses and expiresInDays options', async () => {
    const invite = await service.generateCode(undefined, { maxUses: 5, expiresInDays: 7 });
    expect(invite.maxUses).toBe(5);
    expect(invite.expiresAt).toBeInstanceOf(Date);
  });

  it('reports an expired code as unusable', async () => {
    const invite = makeInvite({ expiresAt: new Date(Date.now() - 1000) });
    repo.store.set(invite.code, invite);
    expect(service.isUsable(invite)).toBe(false);
  });

  it('reports a depleted code as unusable', async () => {
    const invite = makeInvite({ maxUses: 1, uses: 1 });
    repo.store.set(invite.code, invite);
    expect(service.isUsable(invite)).toBe(false);
  });

  it('consumes a usable code and increments uses', async () => {
    const invite = makeInvite();
    repo.store.set(invite.code, invite);
    expect(await service.consume(invite.code)).toBe(true);
    expect(repo.store.get(invite.code)!.uses).toBe(1);
  });

  it('does not consume an unusable code', async () => {
    const invite = makeInvite({ uses: 1 });
    repo.store.set(invite.code, invite);
    expect(await service.consume(invite.code)).toBe(false);
    expect(repo.store.get(invite.code)!.uses).toBe(1);
  });

  it('removes a code by id', async () => {
    const invite = makeInvite();
    repo.store.set(invite.code, invite);
    await service.remove(invite.id);
    expect(repo.store.size).toBe(0);
  });
});
