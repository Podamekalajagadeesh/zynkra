/**
 * E2EE key rotation (server side).
 *
 * The server stores public key material only. These tests pin the rotation
 * semantics peers depend on: identity changes are recorded so they can be
 * detected, signed pre-keys keep exactly current + previous, one-time pre-key
 * keyIds are never re-used, and bundle consumption claims a key exactly once.
 */
import { NotFoundException } from '@nestjs/common';
import { PreKeysService } from './prekeys.service';

const USER = { id: 'user-1', publicKey: 'IK-old' };

function makeService(overrides: {
  user?: any;
  signedPreKeys?: any[];
  oneTimePreKeys?: any[];
  rotationEvents?: any[];
  claimedPreKey?: any;
} = {}) {
  const rotationEvents = overrides.rotationEvents ?? [];
  let eventSeq = 0;

  const rotationEventsRepository = {
    find: jest.fn().mockImplementation(async (options: any) => {
      let rows = rotationEvents.slice();
      if (options?.where?.kind) rows = rows.filter((r) => r.kind === options.where.kind);
      if (options?.where?.createdAt) {
        const op = options.where.createdAt as any;
        const value = op?.value ?? op;
        rows = rows.filter((r) => r.createdAt > value);
      }
      return rows;
    }),
    findOne: jest.fn().mockImplementation(async (options: any) => {
      const rows = rotationEvents
        .filter((r) => !options?.where?.kind || r.kind === options.where.kind)
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return rows[0] ?? null;
    }),
    create: jest.fn((row: any) => ({ ...row })),
    save: jest.fn(async (row: any) => {
      const stored = {
        id: `evt-${++eventSeq}`,
        createdAt: new Date(Date.now() - Math.random() * 1000),
        ...row,
      };
      rotationEvents.push(stored);
      return stored;
    }),
  };

  const signedRows = (overrides.signedPreKeys ?? []).map((r) => ({ ...r }));
  const signedPreKeysRepository = {
    find: jest.fn().mockImplementation(async () =>
      signedRows.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    ),
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      const matches = signedRows
        .filter((r) => r.userId === where.userId && (where.keyId === undefined || r.keyId === where.keyId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return matches[0] ? { ...matches[0] } : null;
    }),
    create: jest.fn((row: any) => ({ ...row })),
    save: jest.fn(async (row: any) => {
      if (!row.id) {
        row.id = `spk-${row.keyId}`;
        row.createdAt = new Date();
        signedRows.push(row);
      } else {
        const idx = signedRows.findIndex((r) => r.id === row.id);
        if (idx >= 0) signedRows[idx] = { ...signedRows[idx], ...row };
      }
      return row;
    }),
    remove: jest.fn(async (rows: any[]) => {
      for (const row of rows) {
        const idx = signedRows.findIndex((r) => r.id === row.id);
        if (idx >= 0) signedRows.splice(idx, 1);
      }
      return rows;
    }),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    manager: {},
  };

  const otpkRows = (overrides.oneTimePreKeys ?? []).map((r) => ({ ...r }));
  let claimed = overrides.claimedPreKey ?? null;

  const oneTimePreKeysRepository = {
    find: jest.fn().mockImplementation(async () => otpkRows.map((r) => ({ keyId: r.keyId }))),
    count: jest.fn().mockImplementation(async () => otpkRows.filter((r) => !r.isUsed).length),
    create: jest.fn((row: any) => ({ ...row })),
    save: jest.fn(async (input: any) => {
      const rows = Array.isArray(input) ? input : [input];
      for (const row of rows) {
        if (!row.id) {
          row.id = `otpk-${row.keyId}`;
          row.isUsed = false;
          row.createdAt = new Date();
          otpkRows.push(row);
        } else {
          const idx = otpkRows.findIndex((r) => r.id === row.id);
          if (idx >= 0) otpkRows[idx] = { ...otpkRows[idx], ...row };
        }
      }
      return input;
    }),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    manager: {
      transaction: jest.fn().mockImplementation(async (fn: any) => {
        const candidate = claimed;
        if (candidate) claimed = null; // claim once
        const repo = {
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(candidate),
          }),
          save: jest.fn(async (row: any) => {
            const idx = otpkRows.findIndex((r) => r.id === row.id);
            if (idx >= 0) otpkRows[idx] = { ...otpkRows[idx], ...row };
            return row;
          }),
        };
        return fn({ getRepository: () => repo });
      }),
    },
  };

  const usersRepository = {
    findOne: jest.fn().mockResolvedValue(overrides.user === undefined ? { ...USER } : overrides.user),
    save: jest.fn().mockImplementation(async (u: any) => u),
  };

  const service = new PreKeysService(
    usersRepository as any,
    oneTimePreKeysRepository as any,
    signedPreKeysRepository as any,
    {} as any, // preKeyBundlesRepository — unused by these paths
    rotationEventsRepository as any,
  );

  return {
    service,
    rotationEvents,
    signedRows,
    otpkRows,
    usersRepository,
    oneTimePreKeysRepository,
    signedPreKeysRepository,
    setClaimed: (row: any) => {
      claimed = row;
    },
  };
}

describe('PreKeysService key rotation', () => {
  describe('identity key', () => {
    it('records an event when the identity key changes', async () => {
      const { service, rotationEvents, usersRepository } = makeService();
      usersRepository.findOne.mockResolvedValue({ id: 'user-1', publicKey: 'IK-old' });

      await service.uploadIdentityKey('user-1', 'IK-new');

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ publicKey: 'IK-new' }),
      );
      expect(rotationEvents).toHaveLength(1);
      expect(rotationEvents[0]).toMatchObject({ kind: 'identity', keyId: null });
    });

    it('does not record an event when the same key is re-uploaded', async () => {
      const { service, rotationEvents } = makeService();
      await service.uploadIdentityKey('user-1', 'IK-old');
      expect(rotationEvents).toHaveLength(0);
    });

    it('purges pre-keys issued under the old identity on rotation', async () => {
      const { service, oneTimePreKeysRepository, signedPreKeysRepository } =
        makeService();

      await service.uploadIdentityKey('user-1', 'IK-new');

      // Stale one-time pre-keys would hand initiators a public key whose
      // private half is gone (new install); old signed pre-keys no longer
      // verify under the new identity. Both must be wiped so the client's
      // post-rotation upload becomes the only key material.
      expect(oneTimePreKeysRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(signedPreKeysRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });

    it('does not purge pre-keys on a same-key re-upload', async () => {
      const { service, oneTimePreKeysRepository, signedPreKeysRepository } =
        makeService();

      await service.uploadIdentityKey('user-1', 'IK-old');

      expect(oneTimePreKeysRepository.delete).not.toHaveBeenCalled();
      expect(signedPreKeysRepository.delete).not.toHaveBeenCalled();
    });

    it('exposes the current identity key and rotation time to peers', async () => {
      const past = new Date(Date.now() - 60_000);
      const { service } = makeService({
        rotationEvents: [
          { id: 'e1', userId: 'user-1', kind: 'identity', keyId: null, detail: null, createdAt: past },
        ],
      });

      const status = await service.getIdentityKeyStatus('user-1');

      expect(status.publicKey).toBe('IK-old');
      expect(status.rotatedAt).toBe(past.toISOString());
    });

    it('throws when the user has no identity key', async () => {
      const { service } = makeService({ user: { id: 'user-1', publicKey: null } });
      await expect(service.getIdentityKeyStatus('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('signed pre-key', () => {
    const spk = (keyId: number, secondsAgo: number) => ({
      id: `spk-${keyId}`,
      userId: 'user-1',
      keyId,
      publicKey: `SPK-${keyId}`,
      signature: `sig-${keyId}`,
      createdAt: new Date(Date.now() - secondsAgo * 1000),
    });

    it('keeps current + previous and prunes older keys on rotation', async () => {
      const { service, signedRows } = makeService({
        signedPreKeys: [spk(1, 300), spk(2, 200), spk(3, 100)],
      });

      await service.uploadSignedPreKey('user-1', 4, 'SPK-4', 'sig-4');

      const remaining = signedRows.map((r) => r.keyId).sort();
      expect(remaining).toEqual([3, 4]);
      const current = await service.getSignedPreKey('user-1');
      expect(current.keyId).toBe(4);
    });

    it('upserts in place when the same keyId is re-uploaded (no prune, no event)', async () => {
      const { service, rotationEvents, signedRows } = makeService({
        signedPreKeys: [spk(1, 100)],
        rotationEvents: [],
      });

      await service.uploadSignedPreKey('user-1', 1, 'SPK-1-rotated', 'sig-new');

      expect(signedRows).toHaveLength(1);
      expect(signedRows[0].publicKey).toBe('SPK-1-rotated');
      expect(rotationEvents).toHaveLength(0);
    });

    it('records a rotation event when a new keyId appears', async () => {
      const { service, rotationEvents } = makeService({ signedPreKeys: [spk(1, 100)] });
      await service.uploadSignedPreKey('user-1', 2, 'SPK-2', 'sig-2');
      expect(rotationEvents).toEqual([
        expect.objectContaining({ kind: 'signed-prekey', keyId: 2 }),
      ]);
    });
  });

  describe('one-time pre-keys', () => {
    it('skips keyIds that already exist instead of re-using them', async () => {
      const { service, otpkRows } = makeService({
        oneTimePreKeys: [
          { id: 'k1', userId: 'user-1', keyId: 1, publicKey: 'P1', isUsed: false, createdAt: new Date() },
        ],
      });

      const count = await service.uploadOneTimePreKeys('user-1', [
        { keyId: 1, publicKey: 'P1-replaced' },
        { keyId: 2, publicKey: 'P2' },
      ]);

      expect(count).toBe(2);
      expect(otpkRows).toHaveLength(2);
      expect(otpkRows.find((r) => r.keyId === 1)?.publicKey).toBe('P1');
      expect(otpkRows.find((r) => r.keyId === 2)?.publicKey).toBe('P2');
    });

    it('records a batch upload event with counts', async () => {
      const { service, rotationEvents } = makeService();
      await service.uploadOneTimePreKeys('user-1', [
        { keyId: 1, publicKey: 'P1' },
        { keyId: 2, publicKey: 'P2' },
      ]);
      expect(rotationEvents[0]).toMatchObject({
        kind: 'one-time-prekeys',
        detail: JSON.stringify({ uploaded: 2, skipped: 0 }),
      });
    });
  });

  describe('bundle consumption', () => {
    const spk = {
      id: 'spk-1',
      userId: 'user-1',
      keyId: 1,
      publicKey: 'SPK-1',
      signature: 'sig',
      createdAt: new Date(Date.now() - 1000),
    };

    it('claims an unused one-time pre-key exactly once', async () => {
      const otpk = {
        id: 'otpk-1',
        userId: 'user-1',
        keyId: 7,
        publicKey: 'OPK-7',
        isUsed: false,
        createdAt: new Date(),
      };
      const { service, setClaimed, otpkRows } = makeService({
        signedPreKeys: [spk],
        oneTimePreKeys: [otpk],
      });
      setClaimed(otpk);

      const first = await service.getPreKeyBundle('user-1');
      expect(first.oneTimePreKey).toEqual({ keyId: 7, publicKey: 'OPK-7' });
      expect(otpkRows[0].isUsed).toBe(true);

      const second = await service.getPreKeyBundle('user-1');
      expect(second.oneTimePreKey).toBeNull();
    });

    it('includes identityRotatedAt so initiators can detect rotation', async () => {
      const rotatedAt = new Date(Date.now() - 5000);
      const { service } = makeService({
        signedPreKeys: [spk],
        rotationEvents: [
          { id: 'e1', userId: 'user-1', kind: 'identity', keyId: null, detail: null, createdAt: rotatedAt },
        ],
      });

      const bundle = await service.getPreKeyBundle('user-1');

      expect(bundle.identityRotatedAt).toBe(rotatedAt.toISOString());
      expect(bundle.identityKey).toBe('IK-old');
    });
  });

  describe('rotation events feed', () => {
    it('returns events strictly after `since`, newest first', async () => {
      const since = new Date(Date.now() - 30_000);
      const { service } = makeService({
        rotationEvents: [
          { id: 'old', userId: 'user-1', kind: 'identity', keyId: null, detail: null, createdAt: new Date(Date.now() - 120_000) },
          { id: 'new', userId: 'user-1', kind: 'signed-prekey', keyId: 2, detail: null, createdAt: new Date(Date.now() - 10_000) },
        ],
      });

      const events = await service.getRotationEvents('user-1', since);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ kind: 'signed-prekey', keyId: 2 });
    });
  });
});
