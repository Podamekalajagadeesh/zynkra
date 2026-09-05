import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DmsService } from './dms.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageReceipt } from './entities/message-receipt.entity';
import { User, MessagePrivacy } from '../users/entities/user.entity';
import { VisibilityService } from '../common/visibility/visibility.service';
import { ConversationType } from './conversation-type.enum';
import { DataPermissionsService } from '../common/data-permissions/data-permissions.service';

describe('DmsService message privacy', () => {
  let service: DmsService;
  let conversationsRepository: jest.Mocked<Repository<Conversation>>;
  let messagesRepository: jest.Mocked<Repository<Message>>;
  let usersRepository: jest.Mocked<Repository<User>>;
  let visibilityService: jest.Mocked<VisibilityService>;
  let messageReceiptsRepository: jest.Mocked<Repository<MessageReceipt>>;

  const sender = { id: 'sender', messagePrivacy: MessagePrivacy.EVERYONE } as User;
  const recipient = { id: 'recipient', username: 'recipient', messagePrivacy: MessagePrivacy.EVERYONE } as User;
  const profiles = new Map<string, User>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DmsService,
        { provide: getRepositoryToken(Conversation), useValue: { findOne: jest.fn(), findBy: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(Message), useValue: { findOne: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn(), findBy: jest.fn() } },
        { provide: getRepositoryToken(MessageReaction), useValue: { findOne: jest.fn(), remove: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(MessageReceipt), useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() } },
        { provide: VisibilityService, useValue: { isBlockedEither: jest.fn().mockResolvedValue(false) } },
        { provide: DataPermissionsService, useValue: { require: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<DmsService>(DmsService);
    conversationsRepository = module.get(getRepositoryToken(Conversation));
    messagesRepository = module.get(getRepositoryToken(Message));
    usersRepository = module.get(getRepositoryToken(User));
    messageReceiptsRepository = module.get(getRepositoryToken(MessageReceipt));
    visibilityService = module.get(VisibilityService);
    profiles.clear();
    profiles.set(sender.id, sender);
    profiles.set(recipient.id, recipient);
    usersRepository.findOne.mockImplementation(async ({ where }: any) => profiles.get(where.id) ?? null);
    usersRepository.findBy.mockImplementation(async ({ id }: any) => {
      const ids = id?._value ?? id ?? [];
      return (Array.isArray(ids) ? ids : [ids]).map((id: string) => profiles.get(id)).filter(Boolean) as User[];
    });
    conversationsRepository.create.mockImplementation((value: any) => value);
    conversationsRepository.save.mockImplementation(async (value: any) => value);
    messagesRepository.create.mockImplementation((value: any) => value);
    messagesRepository.save.mockImplementation(async (value: any) => value);
  });

  it('allows friends of friends to start a conversation', async () => {
    const sharedFriend = { id: 'shared', following: [{ id: sender.id }, { id: recipient.id }] } as User;
    profiles.set(sender.id, { ...sender, following: [sharedFriend] } as User);
    profiles.set(recipient.id, { ...recipient, messagePrivacy: MessagePrivacy.FRIENDS_OF_FRIENDS, following: [sharedFriend] } as User);

    await expect(service.createConversation(sender, [recipient.id])).resolves.toBeDefined();
  });

  it('rejects users without a shared friend when friends of friends is selected', async () => {
    profiles.set(recipient.id, { ...recipient, messagePrivacy: MessagePrivacy.FRIENDS_OF_FRIENDS, following: [] } as User);

    await expect(service.createConversation(sender, [recipient.id])).rejects.toThrow('You cannot send messages');
  });

  it('allows mutual friends when friends-only privacy is selected', async () => {
    profiles.set(sender.id, {
      ...sender,
      following: [{ id: recipient.id, following: [{ id: sender.id }] }],
    } as User);
    profiles.set(recipient.id, {
      ...recipient,
      messagePrivacy: MessagePrivacy.FRIENDS,
      following: [{ id: sender.id, following: [{ id: recipient.id }] }],
    } as User);

    await expect(service.createConversation(sender, [recipient.id])).resolves.toBeDefined();
  });

  it('rejects non-friends when friends-only privacy is selected', async () => {
    profiles.set(recipient.id, { ...recipient, messagePrivacy: MessagePrivacy.FRIENDS, following: [] } as User);

    await expect(service.createConversation(sender, [recipient.id])).rejects.toThrow('You cannot send messages');
  });

  it('re-checks privacy when sending in an existing one-to-one conversation', async () => {
    profiles.set(recipient.id, { ...recipient, messagePrivacy: MessagePrivacy.NO_ONE } as User);
    conversationsRepository.findOne.mockResolvedValue({
      id: 'conversation',
      type: ConversationType.ONE_TO_ONE,
      participants: [sender, profiles.get(recipient.id)],
    } as Conversation);

    await expect(service.sendMessage(sender, 'conversation', { content: 'hello' } as any)).rejects.toThrow('You cannot send messages');
  });

  it('applies privacy checks when forwarding into an existing one-to-one conversation', async () => {
    profiles.set(recipient.id, { ...recipient, messagePrivacy: MessagePrivacy.NO_ONE } as User);
    conversationsRepository.findOne.mockResolvedValue({
      id: 'conversation',
      type: ConversationType.ONE_TO_ONE,
      participants: [sender, profiles.get(recipient.id)],
    } as Conversation);
    messagesRepository.findOne.mockResolvedValue({ id: 'original', content: 'hello' } as Message);

    await expect(service.forwardMessage(sender, 'original', { conversationId: 'conversation' } as any)).rejects.toThrow('You cannot send messages');
  });

  it('still blocks all message paths when either user has blocked the other', async () => {
    visibilityService.isBlockedEither.mockResolvedValue(true);
    await expect(service.createConversation(sender, [recipient.id])).rejects.toThrow('You cannot send messages');
  });

  it('does not create an individual receipt when the user disables read receipts', async () => {
    const user = { ...recipient, readReceipts: false } as User;
    const message = {
      id: 'message',
      conversation: { participants: [sender, user] },
    } as Message;
    messagesRepository.findOne.mockResolvedValue(message);

    await expect(service.markMessageAsRead(user, message.id)).resolves.toBeNull();
    expect(messageReceiptsRepository.create).not.toHaveBeenCalled();
    expect(messageReceiptsRepository.save).not.toHaveBeenCalled();
  });

  it('creates an individual receipt when the user enables read receipts', async () => {
    const user = { ...recipient, readReceipts: true } as User;
    const message = {
      id: 'message',
      conversation: { participants: [sender, user] },
    } as Message;
    const receipt = { id: 'receipt', user, message } as MessageReceipt;
    messagesRepository.findOne.mockResolvedValue(message);
    messageReceiptsRepository.findOne.mockResolvedValue(null);
    messageReceiptsRepository.create.mockReturnValue(receipt);
    messageReceiptsRepository.save.mockResolvedValue(receipt);

    await expect(service.markMessageAsRead(user, message.id)).resolves.toBe(receipt);
    expect(messageReceiptsRepository.save).toHaveBeenCalledWith(receipt);
  });

  it('reports zero bulk receipts when the user disables read receipts', async () => {
    const user = { ...recipient, readReceipts: false } as User;
    const conversation = {
      id: 'conversation',
      participants: [sender, user],
    } as Conversation;
    conversationsRepository.findOne.mockResolvedValue(conversation);
    messagesRepository.find.mockResolvedValue([
      { sender, readBy: [] },
    ] as Message[]);

    await expect(service.markConversationAsRead(user, conversation.id)).resolves.toEqual({
      conversationId: conversation.id,
      markedCount: 0,
    });
    expect(messageReceiptsRepository.save).not.toHaveBeenCalled();
  });
});