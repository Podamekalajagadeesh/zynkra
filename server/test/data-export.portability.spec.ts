import { ExportService, ExportData } from '../src/data-export/export.service';
import { User } from '../src/users/entities/user.entity';
import { Conversation } from '../src/dms/entities/conversation.entity';
import { Message } from '../src/dms/entities/message.entity';
import { Follow } from '../src/users/entities/follow.entity';
import { LedgerEntry } from '../src/wallet/entities/ledger-entry.entity';
import { Order } from '../src/marketplace/entities/order.entity';
import { VerificationRequest } from '../src/verification/entities/verification-request.entity';
import { ConnectedAccount } from '../src/connected-accounts/entities/connected-account.entity';

const UserClass = User as any;

type Store = {
  users: any[];
  follows: any[];
  conversations: any[];
  messages: any[];
  ledger: any[];
  orders: any[];
  verifications: any[];
  connected: any[];
};

function createFakeManager(store: Store) {
  const storeFor = (entity: any): any[] => {
    if (entity === UserClass) return store.users;
    if (entity === Follow) return store.follows;
    if (entity === Conversation) return store.conversations;
    if (entity === Message) return store.messages;
    if (entity === LedgerEntry) return store.ledger;
    if (entity === Order) return store.orders;
    if (entity === VerificationRequest) return store.verifications;
    if (entity === ConnectedAccount) return store.connected;
    return [];
  };

  const matchWhere = (row: any, where: any): boolean => {
    for (const key of Object.keys(where || {})) {
      const expected = where[key];
      if (expected && typeof expected === 'object' && !Array.isArray(expected._value) && 'id' in expected && key === 'participants') {
        if (!(row.participants || []).some((p: any) => p.id === expected.id)) return false;
      } else if (expected && typeof expected === 'object' && Array.isArray(expected._value)) {
        if (!expected._value.includes(row[key])) return false;
      } else if (row[key] !== expected) {
        return false;
      }
    }
    return true;
  };

  let seq = 0;
  return {
    findOne: async (entity: any, criteria: any) => {
      const rows = storeFor(entity);
      return rows.find((r) => matchWhere(r, criteria?.where ?? {})) ?? null;
    },
    find: async (entity: any, criteria: any) => {
      const rows = storeFor(entity);
      return rows.filter((r) => matchWhere(r, criteria?.where ?? {}));
    },
    create: (entity: any, partial: any) => ({ ...partial }),
    save: async (entity: any, row: any) => {
      if (entity === UserClass) return row;
      const rows = storeFor(entity);
      if (!row.id) row.id = `${String((entity as any).name ?? 'x')}-${++seq}`;
      if (!rows.includes(row)) rows.push(row);
      return row;
    },
  };
}

const ALL_PERMS = [
  'profile',
  'posts',
  'messages',
  'connected_services',
  'settings',
  'personalization',
  'analytics',
];

function makePayload(overrides: Partial<ExportData>): any {
  return {
    user: { id: 'me', username: 'alice', displayName: 'Alice', bio: 'hi' },
    posts: [],
    comments: [],
    reactions: [],
    follows: { following: [], followers: [] },
    bookmarks: [],
    stories: [],
    reels: [],
    messages: [],
    conversations: [],
    articles: [],
    podcasts: [],
    courses: [],
    enrollments: [],
    groupMemberships: [],
    notifications: [],
    orders: [],
    wallet: [],
    verification: [],
    linkedAccounts: [],
    settings: {},
    personalization: {},
    analytics: {},
    version: '2.1.0',
    ...overrides,
  };
}

function buildService(store: Store): ExportService {
  const repos: any[] = Array.from({ length: 20 }, () => ({}));
  repos[1] = { manager: { transaction: (cb: any) => cb(createFakeManager(store)) } };
  return Reflect.construct(ExportService, repos) as ExportService;
}

describe('Data export portability — transactional import', () => {
  it('restores 1:1 DMs with a resolved peer and reuses the thread on re-import', async () => {
    const store: Store = {
      users: [
        { id: 'me', username: 'alice', publicKey: 'k1', accountDataPermissions: ALL_PERMS, verified: false },
        { id: 'peer-a', username: 'bob', publicKey: 'k2', accountDataPermissions: ALL_PERMS },
      ],
      follows: [], conversations: [], messages: [], ledger: [], orders: [], verifications: [], connected: [],
    };
    const service = buildService(store);
    const payload = makePayload({
      conversations: [
        { id: 'conv-1', type: 'one_to_one', name: null, isEncrypted: true, otherParticipant: { userId: 'peer-a', username: 'bob' } },
      ],
      messages: [
        { id: 'm1', content: 'hey from alice', direction: 'sent', conversationId: 'conv-1', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'm2', content: 'hi back', direction: 'received', conversationId: 'conv-1', createdAt: '2026-01-01T00:01:00.000Z' },
      ],
    });

    const first = await service.importFromJson('me', payload as ExportData);

    expect(first.messages).toBe(2);
    expect(first.conversations).toBe(1);
    expect(first.skippedConversations).toBe(0);
    expect(store.messages).toHaveLength(2);
    expect(store.conversations).toHaveLength(1);
    expect(store.conversations[0].isEncrypted).toBe(true);
    expect(store.conversations[0].participants.map((p: any) => p.id).sort()).toEqual(['me', 'peer-a']);
    const sent = store.messages.find((m) => m.content === 'hey from alice');
    expect(sent.sender.id).toBe('me');
    const received = store.messages.find((m) => m.content === 'hi back');
    expect(received.sender.id).toBe('peer-a');

    const second = await service.importFromJson('me', payload as ExportData);
    expect(second.conversations).toBe(1);
    expect(store.conversations).toHaveLength(1);
    expect(store.messages).toHaveLength(4);
  });

  it('skips group threads and unknown peers without importing their messages', async () => {
    const store: Store = {
      users: [{ id: 'me', username: 'alice', accountDataPermissions: ALL_PERMS }],
      follows: [], conversations: [], messages: [], ledger: [], orders: [], verifications: [], connected: [],
    };
    const service = buildService(store);
    const payload = makePayload({
      conversations: [
        { id: 'conv-unknown', type: 'one_to_one', otherParticipant: { username: 'ghost' } },
        { id: 'conv-group', type: 'group', name: 'travel', otherParticipant: null },
      ],
      messages: [
        { id: 'm1', content: 'to nobody', direction: 'sent', conversationId: 'conv-unknown', createdAt: '2026-01-01T00:00:00.000Z' },
      ],
    });

    const result = await service.importFromJson('me', payload as ExportData);

    expect(result.skippedConversations).toBe(2);
    expect(result.conversations).toBe(0);
    expect(result.messages).toBe(0);
    expect(store.messages).toHaveLength(0);
    expect(store.conversations).toHaveLength(0);
  });

  it('imports wallet, orders, verification, and linked accounts as archival only', async () => {
    const store: Store = {
      users: [{ id: 'me', username: 'alice', accountDataPermissions: ALL_PERMS, verified: false }],
      follows: [], conversations: [], messages: [], ledger: [], orders: [], verifications: [], connected: [],
    };
    const service = buildService(store);
    const payload = makePayload({
      wallet: [
        { type: 'earning', amount: 50, balanceAfter: 50, currency: 'usd', reference: 'ref-1', purpose: 'post-support', createdAt: '2026-01-01T00:00:00.000Z' },
      ],
      orders: [{ id: 'o1', total: 20, status: 'delivered', createdAt: '2026-01-02T00:00:00.000Z' }],
      verification: [
        { category: 'creator', status: 'approved', justification: 'I am a creator', links: [], createdAt: '2026-01-03T00:00:00.000Z' },
      ],
      linkedAccounts: [
        { platform: 'twitter', platformUsername: '@alice', platformUserId: '123', accessToken: 'SECRET' },
      ],
    });

    const result = await service.importFromJson('me', payload as ExportData);

    expect(result.walletEntries).toBe(1);
    expect(result.orders).toBe(1);
    expect(result.verificationRequests).toBe(1);
    expect(result.linkedAccounts).toBe(1);

    expect(store.ledger).toHaveLength(1);
    expect(store.ledger[0].metadata.imported).toBe(true);
    expect(store.ledger[0].reference).toBe('ref-1');

    expect(store.orders).toHaveLength(1);
    expect(store.orders[0].customerId).toBe('me');
    expect(store.orders[0].status).toBe('delivered');

    expect(store.verifications).toHaveLength(1);
    expect(store.verifications[0].status).toBe('approved');
    expect(store.users[0].verified).toBe(false);

    expect(store.connected).toHaveLength(1);
    expect(store.connected[0].platform).toBe('twitter');
    expect(store.connected[0].accessToken).toBeNull();
    expect(store.connected[0].apiKey).toBeNull();
  });

  it('imports nothing when the matching data category is disabled', async () => {
    const store: Store = {
      users: [{ id: 'me', username: 'alice', accountDataPermissions: ['profile'] }],
      follows: [], conversations: [], messages: [], ledger: [], orders: [], verifications: [], connected: [],
    };
    const service = buildService(store);
    const payload = makePayload({
      conversations: [
        { id: 'conv-1', type: 'one_to_one', otherParticipant: { username: 'bob' } },
      ],
      messages: [{ id: 'm1', content: 'secret', direction: 'sent', conversationId: 'conv-1' }],
      wallet: [{ type: 'earning', amount: 5, balanceAfter: 5 }],
      orders: [{ total: 1, status: 'delivered' }],
      linkedAccounts: [{ platform: 'twitter', platformUsername: '@alice' }],
    });

    const result = await service.importFromJson('me', payload as ExportData);

    expect(result.messages).toBe(0);
    expect(result.conversations).toBe(0);
    expect(result.walletEntries).toBe(0);
    expect(result.orders).toBe(0);
    expect(result.linkedAccounts).toBe(0);
    expect(store.conversations).toHaveLength(0);
  });
});