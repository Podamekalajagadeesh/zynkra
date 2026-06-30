import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Note } from './entities/note.entity';
import { User } from '../users/entities/user.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { subHours } from 'date-fns';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
  ) {}

  async create(createNoteDto: CreateNoteDto, user: User): Promise<Note> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const note = this.notesRepository.create({
      ...createNoteDto,
      user,
      expiresAt,
      helpfulnessUpvotes: 0,
      helpfulnessDownvotes: 0,
    });

    return this.notesRepository.save(note);
  }

  async findByPost(postId: string): Promise<Note[]> {
    return this.notesRepository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findUserNote(userId: string): Promise<Note | null> {
    return this.notesRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findFollowingNotes(userId: string, followingIds: string[]): Promise<Note[]> {
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return this.notesRepository
      .createQueryBuilder('note')
      .where('note.userId IN (:...followingIds)', { followingIds })
      .andWhere('note.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
      .orderBy('note.createdAt', 'DESC')
      .getMany();
  }

  async voteHelpfulness(id: string, isUpvote: boolean): Promise<Note> {
    const note = await this.notesRepository.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Note with ID "${id}" not found`);
    }

    if (isUpvote) {
      note.helpfulnessUpvotes++;
    } else {
      note.helpfulnessDownvotes++;
    }

    return this.notesRepository.save(note);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notesRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Note with ID "${id}" not found`);
    }
  }

  async cleanupExpiredNotes(): Promise<void> {
    await this.notesRepository.delete({ expiresAt: LessThan(new Date()) });
  }
}