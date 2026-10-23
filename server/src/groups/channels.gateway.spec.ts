import { ChannelsGateway, ChannelMessageEvent } from './channels.gateway';

function makeGateway() {
  const emit = jest.fn();
  const gateway = new ChannelsGateway(
    {} as any,
    {} as any,
    { allow: jest.fn(() => true), release: jest.fn() } as any,
    {} as any,
    {} as any
  );
  gateway.server = { to: jest.fn(() => ({ emit })) } as unknown as any;
  return { gateway, emit };
}

// The message entity carries far more than sockets may broadcast — sender is
// a full User row (password_hash, email, phone, …) until @Exclude runs, and
// REST gets ClassSerializerInterceptor while socket payloads do not.
function makeMessage() {
  return {
    id: 'm1',
    content: 'hello',
    mediaType: 'text',
    mediaUrl: null,
    media: null,
    voiceNote: null,
    createdAt: new Date('2026-10-23T12:00:00.000Z'),
    replyTo: { id: 'm0', content: 'earlier' },
    reactions: [{ id: 'r1', reaction: '👍' }],
    readBy: [{ id: 'rr1' }],
    senderPublicKey: 'REPLACE_WITH_ACTUAL_KEY',
    sender: {
      id: 'u1',
      username: 'zoe',
      displayName: 'Zoe',
      avatar: 'a.png',
      passwordHash: '$2b$10$secret',
      email: 'zoe@secret.example',
      phone: '+15551234',
      encryptedPrivateKey: 'ciphertext',
    },
  } as any;
}

describe('ChannelsGateway serialization', () => {
  it('emits only allowlisted fields on newMessage (no password_hash/email/phone)', () => {
    const { gateway, emit } = makeGateway();

    gateway.sendMessageToChannel('c1', makeMessage());

    expect(emit).toHaveBeenCalledTimes(1);
    const [event, payload] = emit.mock.calls[0];
    expect(event).toBe('newMessage');

    expect(Object.keys(payload).sort()).toEqual([
      'channelId',
      'content',
      'createdAt',
      'id',
      'media',
      'mediaType',
      'mediaUrl',
      'sender',
      'voiceNote',
    ]);
    expect(Object.keys(payload.sender).sort()).toEqual([
      'avatar',
      'displayName',
      'id',
      'username',
    ]);

    const wire = JSON.stringify(payload);
    expect(wire).not.toContain('passwordHash');
    expect(wire).not.toContain('password_hash');
    expect(wire).not.toContain('zoe@secret.example');
    expect(wire).not.toContain('+15551234');
    expect(wire).not.toContain('encryptedPrivateKey');
    expect(wire).not.toContain('senderPublicKey');
  });

  it('keeps the persisted media/voiceNote payloads in the event', () => {
    const { gateway, emit } = makeGateway();
    const message = makeMessage();
    message.media = [{ type: 'image', url: 'https://cdn/x.png' }];
    message.voiceNote = { url: 'https://cdn/x.ogg', durationSeconds: 4 };

    gateway.sendMessageToChannel('c1', message);

    const payload = emit.mock.calls[0][1] as ChannelMessageEvent;
    expect(payload.media).toEqual([{ type: 'image', url: 'https://cdn/x.png' }]);
    expect(payload.voiceNote).toEqual({ url: 'https://cdn/x.ogg', durationSeconds: 4 });
  });

  it('nulls absent media fields instead of leaving them undefined', () => {
    const { gateway, emit } = makeGateway();
    const message = makeMessage();
    message.mediaUrl = undefined;
    message.media = undefined;
    message.voiceNote = undefined;

    gateway.sendMessageToChannel('c1', message);

    const payload = emit.mock.calls[0][1] as ChannelMessageEvent;
    expect(payload.mediaUrl).toBeNull();
    expect(payload.media).toBeNull();
    expect(payload.voiceNote).toBeNull();
  });
});

describe('ChannelsGateway.kickUserFromGroupRooms', () => {
  it('drops only the departing user sockets out of the given rooms', async () => {
    const { gateway } = makeGateway();
    const leave = jest.fn();
    const otherLeave = jest.fn();
    const sockets = new Map<string, any>([
      [
        's1',
        {
          data: { userId: 'u1' },
          rooms: new Set(['c1', 'c2']),
          leave: leave,
        },
      ],
      [
        's2',
        {
          data: { userId: 'u2' },
          rooms: new Set(['c1']),
          leave: otherLeave,
        },
      ],
    ]);
    (gateway.server as any).sockets = { sockets };

    await gateway.kickUserFromGroupRooms('u1', ['c1']);

    expect(leave).toHaveBeenCalledWith('c1');
    expect(otherLeave).not.toHaveBeenCalled();
  });

  it('does nothing when the user has no sockets or no rooms were given', async () => {
    const { gateway } = makeGateway();
    (gateway.server as any).sockets = { sockets: new Map() };

    await expect(gateway.kickUserFromGroupRooms('u1', [])).resolves.toBeUndefined();
    await expect(gateway.kickUserFromGroupRooms('u1', ['c1'])).resolves.toBeUndefined();
  });
});
