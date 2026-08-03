import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThreadsService } from './threads.service';
import { Thread } from './entities/thread.entity';
import { ThreadMessage } from './entities/thread-message.entity';

function makeThread(overrides: Partial<Thread> = {}): Thread {
  const thread = new Thread();
  Object.assign(thread, {
    id: 'thread-1',
    userId: 'user-1',
    title: 'Test thread',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  return thread;
}

function makeMessage(overrides: Partial<ThreadMessage> = {}): ThreadMessage {
  const message = new ThreadMessage();
  Object.assign(message, {
    id: 'msg-1',
    threadId: 'thread-1',
    userId: 'user-1',
    content: 'Hello',
    parentMessageId: null,
    createdAt: new Date(),
    ...overrides,
  });
  return message;
}

describe('ThreadsService', () => {
  let service: ThreadsService;
  let threadsRepo: jest.Mocked<Repository<Thread>>;
  let messagesRepo: jest.Mocked<Repository<ThreadMessage>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreadsService,
        {
          provide: getRepositoryToken(Thread),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ThreadMessage),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ThreadsService>(ThreadsService);
    threadsRepo = module.get(getRepositoryToken(Thread));
    messagesRepo = module.get(getRepositoryToken(ThreadMessage));
  });

  describe('createThread', () => {
    it('creates a thread without an initial message', async () => {
      threadsRepo.create.mockReturnValue(makeThread());
      threadsRepo.save.mockResolvedValue(makeThread());
      threadsRepo.findOne.mockResolvedValue(makeThread());

      const result = await service.createThread({ title: 'Test thread' }, 'user-1');

      expect(result.id).toBe('thread-1');
      expect(threadsRepo.create).toHaveBeenCalledWith({
        title: 'Test thread',
        userId: 'user-1',
      });
      expect(messagesRepo.save).not.toHaveBeenCalled();
    });

    it('creates an initial message when content is provided', async () => {
      threadsRepo.create.mockReturnValue(makeThread());
      threadsRepo.save.mockResolvedValue(makeThread());
      threadsRepo.findOne.mockResolvedValue(makeThread());
      messagesRepo.create.mockReturnValue(makeMessage());
      messagesRepo.save.mockResolvedValue(makeMessage());

      await service.createThread({ title: 'Test thread', content: 'First!' }, 'user-1');

      expect(messagesRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('attaches message counts and last-message timestamps', async () => {
      const thread = makeThread();
      threadsRepo.find.mockResolvedValue([thread]);
      const last = new Date('2026-01-01T00:00:00Z');
      (messagesRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { threadId: 'thread-1', messageCount: 3, lastMessageAt: last },
        ]),
      });

      const result = await service.findAll();

      expect(result[0].messageCount).toBe(3);
      expect(result[0].lastMessageAt).toBe(last);
      expect(threadsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['user'], order: { createdAt: 'DESC' } }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when thread is missing', async () => {
      threadsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('returns the thread with its messages', async () => {
      threadsRepo.findOne.mockResolvedValue(makeThread());
      messagesRepo.find.mockResolvedValue([makeMessage()]);

      const result = await service.findOne('thread-1');

      expect(result.messages).toHaveLength(1);
      expect(messagesRepo.find).toHaveBeenCalledWith({
        where: { threadId: 'thread-1' },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('sendMessage', () => {
    it('throws NotFoundException when thread is missing', async () => {
      threadsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage('bad-id', { content: 'Hi' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the parent is outside the thread', async () => {
      threadsRepo.findOne.mockResolvedValue(makeThread());
      messagesRepo.findOne.mockResolvedValue(makeMessage({ threadId: 'other-thread' }));

      await expect(
        service.sendMessage('thread-1', { content: 'Hi', parentMessageId: 'msg-1' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('stores the parentMessageId for branching', async () => {
      threadsRepo.findOne.mockResolvedValue(makeThread());
      messagesRepo.findOne.mockResolvedValue(makeMessage());
      messagesRepo.create.mockReturnValue(makeMessage({ parentMessageId: 'msg-1' }));
      messagesRepo.save.mockResolvedValue(makeMessage({ parentMessageId: 'msg-1' }));
      messagesRepo.findOne.mockResolvedValue(
        makeMessage({ parentMessageId: 'msg-1', user: { id: 'user-1' } as any }),
      );

      const result = await service.sendMessage(
        'thread-1',
        { content: 'Reply', parentMessageId: 'msg-1' },
        'user-1',
      );

      expect(result.parentMessageId).toBe('msg-1');
      expect(messagesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ threadId: 'thread-1', parentMessageId: 'msg-1' }),
      );
    });
  });

  describe('deleteThread', () => {
    it('throws NotFoundException when missing', async () => {
      threadsRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteThread('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('forbids non-creators', async () => {
      threadsRepo.findOne.mockResolvedValue(makeThread({ userId: 'owner-1' }));

      await expect(service.deleteThread('thread-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('removes the thread for its creator', async () => {
      threadsRepo.findOne.mockResolvedValue(makeThread());
      threadsRepo.remove.mockResolvedValue(makeThread());

      await service.deleteThread('thread-1', 'user-1');

      expect(threadsRepo.remove).toHaveBeenCalled();
    });
  });

  describe('deleteMessage', () => {
    it('throws NotFoundException when the message is not in the thread', async () => {
      messagesRepo.findOne.mockResolvedValue(makeMessage({ threadId: 'other' }));

      await expect(
        service.deleteMessage('thread-1', 'msg-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids non-authors', async () => {
      messagesRepo.findOne.mockResolvedValue(makeMessage({ userId: 'author-1' }));

      await expect(
        service.deleteMessage('thread-1', 'msg-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('removes the message for its author', async () => {
      messagesRepo.findOne.mockResolvedValue(makeMessage());
      messagesRepo.remove.mockResolvedValue(makeMessage());

      await service.deleteMessage('thread-1', 'msg-1', 'user-1');

      expect(messagesRepo.remove).toHaveBeenCalled();
    });
  });
});
