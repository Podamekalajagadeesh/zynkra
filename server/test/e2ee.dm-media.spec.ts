import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DmsService } from '../src/dms/dms.service';
import { Conversation } from '../src/dms/entities/conversation.entity';
import { Message } from '../src/dms/entities/message.entity';
import { MessageReaction } from '../src/dms/entities/message-reaction.entity';
import { MessageReceipt } from '../src/dms/entities/message-receipt.entity';
import { User, MessagePrivacy } from '../src/users/entities/user.entity';
import { VisibilityService } from '../src/common/visibility/visibility.service';
import { DataPermissionsService } from '../src/common/data-permissions/data-permissions.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('libsodium-wrappers');

/**
 * Phase 3: per-attachment client-side encryption for E2EE DM media.
 * The client encrypts the file (XChaCha20-Poly1305) before upload; the key +
 * nonce travel only inside the Signal envelope. This suite proves the server
 * enforces the split: ciphertext media (tagged `enc`) is accepted and stored
 * verbatim, any untagged media on an encrypted thread is rejected, and media
 * without an accompanying envelope is rejected (no key delivery channel).
 */
describe('DM E2EE media (server enforcement)', () => {
  beforeAll(async () => {
    await sodium.ready;
  });

  function buildEnvelope(plaintext: string, recipientPub: Uint8Array, senderPriv: Uint8Array) {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const body = sodium.crypto_box_easy(plaintext, nonce, recipientPub, senderPriv);
    return JSON.stringify({
      type: 1,
      body: sodium.to_base64(body),
      version: 1,
    });
  }

  async function setup() {
    const profiles = new Map<string, User>();
    const conversations: Conversation[] = [];
    const messages: Message[] = [];

    const alice = {
      id: 'alice',
      username: 'alice',
      messagePrivacy: MessagePrivacy.EVERYONE,
      publicKey: 'alice-identity-key-b64',
    } as User;
    const bob = {
      id: 'bob',
      username: 'bob',
      messagePrivacy: MessagePrivacy.EVERYONE,
      publicKey: 'bob-identity-key-b64',
    } as User;
    profiles.set(alice.id, alice);
    profiles.set(bob.id, bob);

    const usersRepository = {
      findOne: jest.fn(async ({ where }: any) => profiles.get(where.id) ?? null),
      findBy: jest.fn(async ({ id }: any) => {
        const ids = id?._value ?? id ?? [];
        const arr = Array.isArray(ids) ? ids : [ids];
        return arr
          .map((value: string) => profiles.get(value))
          .filter(Boolean) as User[];
      }),
    };

    const conversationsRepository = {
      findOne: jest.fn(async ({ where }: any) => {
        const found = conversations.find((c) => c.id === where.id) ?? null;
        if (found && Array.isArray(found.participants)) {
          found.participants = found.participants.map((p) => profiles.get(p.id) ?? p);
        }
        return found;
      }),
      findBy: jest.fn(async () => []),
      create: jest.fn((value: any) => value),
      save: jest.fn(async (value: Conversation) => {
        if (!value.id) value.id = `conv-${conversations.length + 1}`;
        const idx = conversations.findIndex((c) => c.id === value.id);
        if (idx >= 0) conversations[idx] = value;
        else conversations.push(value);
        return value;
      }),
    };

    const messagesRepository = {
      findOne: jest.fn(async ({ where }: any) => messages.find((m) => m.id === where?.id) ?? null),
      find: jest.fn(async () => []),
      create: jest.fn((value: any) => value),
      save: jest.fn(async (value: Message) => {
        if (!value.id) value.id = `msg-${messages.length + 1}`;
        const idx = messages.findIndex((m) => m.id === value.id);
        if (idx >= 0) messages[idx] = value;
        else messages.push(value);
        return value;
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        DmsService,
        { provide: getRepositoryToken(Conversation), useValue: conversationsRepository },
        { provide: getRepositoryToken(Message), useValue: messagesRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(MessageReaction),
          useValue: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: getRepositoryToken(MessageReceipt),
          useValue: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        { provide: VisibilityService, useValue: { isBlockedEither: jest.fn().mockResolvedValue(false) } },
        { provide: DataPermissionsService, useValue: { require: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    const service = module.get<DmsService>(DmsService);
    return { service, alice, bob, messages };
  }

  /** Envelope carrying attachment keys — the Phase 3 payload shape. */
  function attachmentEnvelope(
    attachment: { url: string; type: string; key: string; nonce: string },
    recipientPub: Uint8Array,
    senderPriv: Uint8Array,
  ) {
    return buildEnvelope(JSON.stringify({ v: 1, text: '', attachments: [attachment] }), recipientPub, senderPriv);
  }

  it('accepts ciphertext media with an enc tag and an envelope carrying the keys', async () => {
    const { service, alice, bob, messages } = await setup();
    const aliceDevice = sodium.crypto_box_keypair();
    const bobDevice = sodium.crypto_box_keypair();

    const conv = await service.createConversation(alice, [bob.id]);
    expect(conv.isEncrypted).toBe(true);

    const key = sodium.to_base64(sodium.randombytes_buf(32));
    const nonce = sodium.to_base64(sodium.randombytes_buf(24));
    const envelope = attachmentEnvelope(
      { url: '/uploads/audio/voice.enc', type: 'audio', key, nonce },
      bobDevice.publicKey,
      aliceDevice.privateKey,
    );

    const saved = await service.sendMessage(alice, conv.id, {
      content: envelope,
      media: [{ url: '/uploads/audio/voice.enc', type: 'audio', enc: 'xchacha20poly1305' }],
    });

    expect(saved.media).toHaveLength(1);
    expect(saved.media![0].enc).toBe('xchacha20poly1305');
    // The server stores the media row WITHOUT any key material.
    expect(JSON.stringify(saved.media)).not.toContain(key);
    expect(JSON.stringify(saved.media)).not.toContain(nonce);
    // The key exists only inside the ciphertext envelope, unreadable to the server.
    expect(messages[0].content).toBe(envelope);
    expect(messages[0].content).not.toContain(key);
  });

  it('rejects untagged (plaintext) media on an encrypted conversation', async () => {
    const { service, alice, bob } = await setup();
    const aliceDevice = sodium.crypto_box_keypair();
    const bobDevice = sodium.crypto_box_keypair();

    const conv = await service.createConversation(alice, [bob.id]);
    const envelope = buildEnvelope('{}', bobDevice.publicKey, aliceDevice.privateKey);

    await expect(
      service.sendMessage(alice, conv.id, {
        content: envelope,
        media: [{ url: '/uploads/images/photo.jpg', type: 'image' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects ciphertext media sent without an envelope (no key delivery channel)', async () => {
    const { service, alice, bob } = await setup();
    const conv = await service.createConversation(alice, [bob.id]);

    await expect(
      service.sendMessage(alice, conv.id, {
        content: '',
        media: [{ url: '/uploads/audio/voice.enc', type: 'audio', enc: 'xchacha20poly1305' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows untagged media on a non-encrypted thread (backward compatible)', async () => {
    const { service, alice, bob } = await setup();
    // Both parties have keys, so createConversation stamps isEncrypted — to
    // exercise the plaintext path we clear it, simulating a legacy thread.
    const conv = await service.createConversation(alice, [bob.id]);
    conv.isEncrypted = false;

    const saved = await service.sendMessage(alice, conv.id, {
      content: 'legacy media thread',
      media: [{ url: '/uploads/images/photo.jpg', type: 'image' }],
    });
    expect(saved.media).toHaveLength(1);
    expect(saved.media![0].enc).toBeUndefined();
  });
});
