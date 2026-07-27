import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { subHours } from 'date-fns';

function makeNote(overrides: Partial<Note> = {}): Note {
  const note = new Note();
  Object.assign(note, {
    id: 'note-1',
    userId: 'user-1',
    postId: 'post-1',
    content: 'Test note content',
    helpfulnessUpvotes: 0,
    helpfulnessDownvotes: 0,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  return note;
}

describe('NotesService', () => {
  let service: NotesService;
  let notesRepo: jest.Mocked<Repository<Note>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    notesRepo = module.get(getRepositoryToken(Note));
  });

  describe('create', () => {
    it('creates a note with 24hr expiry', async () => {
      const user = { id: 'user-1', username: 'test' } as any;
      notesRepo.create.mockReturnValue(makeNote());
      notesRepo.save.mockResolvedValue(makeNote());

      const result = await service.create({ content: 'Hello' } as any, user);

      expect(result).toBeDefined();
      expect(notesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello',
          user,
          helpfulnessUpvotes: 0,
          helpfulnessDownvotes: 0,
        }),
      );
    });

    it('creates a note linked to a post', async () => {
      const user = { id: 'user-1' } as any;
      notesRepo.create.mockReturnValue(makeNote({ postId: 'post-1' }));
      notesRepo.save.mockResolvedValue(makeNote({ postId: 'post-1' }));

      const result = await service.create({ content: 'Note on post', postId: 'post-1' } as any, user);

      expect(result.postId).toBe('post-1');
    });
  });

  describe('findByPost', () => {
    it('returns notes for a post ordered by newest', async () => {
      const notes = [makeNote(), makeNote({ id: 'note-2' })];
      notesRepo.find.mockResolvedValue(notes);

      const result = await service.findByPost('post-1');

      expect(result).toHaveLength(2);
      expect(notesRepo.find).toHaveBeenCalledWith({
        where: { postId: 'post-1' },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findUserNote', () => {
    it('returns the latest note for a user', async () => {
      const note = makeNote();
      notesRepo.findOne.mockResolvedValue(note);

      const result = await service.findUserNote('user-1');

      expect(result).toBe(note);
    });

    it('returns null when user has no notes', async () => {
      notesRepo.findOne.mockResolvedValue(null);

      const result = await service.findUserNote('user-1');

      expect(result).toBeNull();
    });
  });

  describe('findFollowingNotes', () => {
    it('returns notes from followed users within 24hrs', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([makeNote()]),
      };
      notesRepo.createQueryBuilder.mockReturnValue(mockQB as any);

      const result = await service.findFollowingNotes('user-1', ['user-2', 'user-3']);

      expect(result).toHaveLength(1);
      expect(mockQB.where).toHaveBeenCalledWith(
        'note.userId IN (:...followingIds)',
        { followingIds: ['user-2', 'user-3'] },
      );
    });
  });

  describe('voteHelpfulness', () => {
    it('increments upvotes', async () => {
      const note = makeNote();
      notesRepo.findOne.mockResolvedValue(note);
      notesRepo.save.mockResolvedValue({ ...note, helpfulnessUpvotes: 1 });

      const result = await service.voteHelpfulness('note-1', true);

      expect(result.helpfulnessUpvotes).toBe(1);
    });

    it('increments downvotes', async () => {
      const note = makeNote();
      notesRepo.findOne.mockResolvedValue(note);
      notesRepo.save.mockResolvedValue({ ...note, helpfulnessDownvotes: 1 });

      const result = await service.voteHelpfulness('note-1', false);

      expect(result.helpfulnessDownvotes).toBe(1);
    });

    it('throws NotFoundException when note not found', async () => {
      notesRepo.findOne.mockResolvedValue(null);

      await expect(service.voteHelpfulness('bad-id', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes a note by id and userId', async () => {
      notesRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete('note-1', 'user-1');

      expect(notesRepo.delete).toHaveBeenCalledWith({ id: 'note-1', userId: 'user-1' });
    });

    it('throws NotFoundException when note not found', async () => {
      notesRepo.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.delete('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cleanupExpiredNotes', () => {
    it('deletes notes past their expiry', async () => {
      notesRepo.delete.mockResolvedValue({ affected: 3 } as any);

      await service.cleanupExpiredNotes();

      expect(notesRepo.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Object),
        }),
      );
    });
  });
});
