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
import { ConversationType } from '../src/dms/conversation-type.enum';
import { DataPermissionsService } from '../src/common/data-permissions/data-permissions.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('libsodium-wrappers');

/**
 * Phase 3: one-to-one DM E2EE. The browser Signal client encrypts before upload;
 * this suite proves the server keeps that promise — it stamps `isEncrypted` when
 * both parties have identity keys, stores only the ciphertext envelope verbatim,
 * rejects any readable plaintext, and round-trips a libsodium ciphertext that the
 * server itself can never decrypt.
 */
describe('DMs end-to-end encryption (server enforcement)', () => {
  beforeAll(async () => {
    await sodium.ready;
  });

  type Keys = { publicKey: Uint8Array; privateKey: Uint8Array };

  /** Produce the exact envelope shape client/src/services/e2ee.service.ts writes. */
  function buildEnvelope(plaintext: string, recipientPub: Uint8Array, senderPriv: Uint8Array) {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const body = sodium.crypto_box_easy(
      plaintext,
      nonce,
      recipientPub,
      senderPriv,
    );
    return {
      envelope: JSON.stringify({
        type: 1,
        body: sodium.to_base64(body),
        version: 1,
      }),
      nonce,
    };
  }

  async function setup() {
    const profiles = new Map<string, User>();
    const conversations: Conversation[] = [];
    const messages: Message[] = [];

    const addUser = (user: User) => {
      profiles.set(user.id, user);
      return user;
    };
    const alice = addUser({
      id: 'alice',
      username: 'alice',
      messagePrivacy: MessagePrivacy.EVERYONE,
      publicKey: 'alice-identity-key-b64',
    } as User);
    const bob = addUser({
      id: 'bob',
      username: 'bob',
      messagePrivacy: MessagePrivacy.EVERYONE,
      publicKey: 'bob-identity-key-b64',
    } as User);
    const carol = addUser({
      id: 'carol',
      username: 'carol',
      messagePrivacy: MessagePrivacy.EVERYONE,
      publicKey: null,
    } as any as User);

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
        // Re-resolve participants from the current profiles, mirroring a fresh
        // DB join (so a user who publishes keys later shows up with them).
        if (found && Array.isArray(found.participants)) {
          found.participants = found.participants.map(
            (p) => profiles.get(p.id) ?? p,
          );
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
      findOne: jest.fn(async () => null),
      find: jest.fn(async ({ where }: any) => {
        const conditions = Array.isArray(where) ? where : [where];
        return messages.filter((m) =>
          conditions.some(
            (c: any) => c?.conversation?.id && m.conversation?.id === c.conversation.id,
          ),
        );
      }),
      create: jest.fn((value: any) => value),
      save: jest.fn(async (value: Message) => {
        messages.push(value);
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
    return { service, alice, bob, carol, conversations, messages, profiles };
  }

  it('round-trips an E2EE message across two devices with no readable plaintext stored', async () => {
    const { service, alice, bob } = await setup();
    const aliceDevice = sodium.crypto_box_keypair();
    const bobDevice = sodium.crypto_box_keypair();
    const plaintext = 'secret: soy milk, pickup at 6pm';
    const { envelope, nonce } = buildEnvelope(
      plaintext,
      bobDevice.publicKey,
      aliceDevice.privateKey,
    );

    const conv = await service.createConversation(alice, [bob.id]);
    expect(conv.isEncrypted).toBe(true);

    await service.sendMessage(alice, conv.id, { content: envelope });

    // Bob fetches the conversation — the stored bytes are the ciphertext envelope, unchanged.
    const bobMessages = await service.getMessages(bob, conv.id);
    expect(bobMessages).toHaveLength(1);
    expect(bobMessages[0].content).toBe(envelope);
    expect(bobMessages[0].content.includes(plaintext)).toBe(false);

    // Bob's device decrypts; the server never had the key.
    const parsed = JSON.parse(bobMessages[0].content);
    const clear = sodium.crypto_box_open_easy(
      sodium.from_base64(parsed.body),
      nonce,
      aliceDevice.publicKey,
      bobDevice.privateKey,
    );
    expect(sodium.to_string(clear)).toBe(plaintext);
    expect(parsed.version).toBe(1);
  });

  it('rejects readable plaintext in an encrypted conversation', async () => {
    const { service, alice, bob } = await setup();
    const conv = await service.createConversation(alice, [bob.id]);
    expect(conv.isEncrypted).toBe(true);

    await expect(
      service.sendMessage(alice, conv.id, { content: 'hi bob, this is readable plaintext' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects plaintext edits in an encrypted conversation', async () => {
    const { service, alice, bob } = await setup();
    const aliceDevice = sodium.crypto_box_keypair();
    const bobDevice = sodium.crypto_box_keypair();
    const sent = buildEnvelope('original secret', bobDevice.publicKey, aliceDevice.privateKey);

    const conv = await service.createConversation(alice, [bob.id]);
    const message = await service.sendMessage(alice, conv.id, { content: sent.envelope });

    await expect(
      service.updateMessage(alice, message.id, 'edited plaintext'),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows legacy plaintext while a participant has no identity key', async () => {
    const { service, alice, carol } = await setup();
    const conv = await service.createConversation(alice, [carol.id]);

    expect(conv.isEncrypted).toBe(false);
    await expect(
      service.sendMessage(alice, conv.id, { content: 'legacy plaintext is still allowed here' }),
    ).resolves.toBeDefined();
  });

  it('progressively upgrades a legacy thread on the first encrypted send', async () => {
    const { service, alice, carol, profiles } = await setup();
    const conv = await service.createConversation(alice, [carol.id]);
    expect(conv.isEncrypted).toBe(false);

    // Carol publishes identity keys (as her modern client would after login).
    profiles.set(carol.id, { ...carol, publicKey: 'carol-identity-key-b64' } as User);

    const carolDevice = sodium.crypto_box_keypair();
    const aliceDevice = sodium.crypto_box_keypair();
    const { envelope } = buildEnvelope('now encrypted', carolDevice.publicKey, aliceDevice.privateKey);

    await service.sendMessage(alice, conv.id, { content: envelope });

    expect(conv.isEncrypted).toBe(true);
    // After the upgrade, plaintext is rejected on the same thread.
    await expect(
      service.sendMessage(alice, conv.id, { content: 'this must now fail' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps group conversations plaintext (E2EE is one-to-one only for now)', async () => {
    const { service, alice, bob, carol } = await setup();
    const conv = await service.createConversation(alice, [bob.id, carol.id], 'Travel plans');
    expect(conv.type).toBe(ConversationType.GROUP);
    expect(conv.isEncrypted).toBe(false);

    await expect(
      service.sendMessage(alice, conv.id, { content: 'group message stays plaintext' }),
    ).resolves.toBeDefined();
  });
});