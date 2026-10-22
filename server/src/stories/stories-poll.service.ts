import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryPollVote } from './entities/story-poll-vote.entity';
import { StoryElement, StoryElementType } from './entities/story-element.entity';
import { StoriesService } from './stories.service';

export interface PollResults {
  optionCounts: number[];
  totalVotes: number;
  myVote: number | null;
}

@Injectable()
export class StoriesPollService {
  constructor(
    @InjectRepository(StoryPollVote)
    private readonly pollVotesRepository: Repository<StoryPollVote>,
    private readonly storiesService: StoriesService
  ) {}

  /**
   * Resolves the story (visibility), enforces the expiry guardrail, and returns
   * the poll element with its options. Every vote/result path goes through this.
   */
  private async findPollElement(
    storyId: string,
    elementId: string,
    userId: string
  ): Promise<{ element: StoryElement; options: string[] }> {
    const story = await this.storiesService.findOne(storyId, userId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }
    if (story.expiresAt && story.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This story has expired.');
    }

    const element = story.elements?.find((candidate) => candidate.id === elementId);
    if (!element || element.type !== StoryElementType.POLL) {
      throw new NotFoundException('Poll element not found');
    }

    const data = element.data as { options?: unknown };
    if (!Array.isArray(data.options) || data.options.length === 0) {
      throw new BadRequestException('Poll has no options');
    }
    return { element, options: data.options as string[] };
  }

  private async buildResults(
    elementId: string,
    options: string[],
    userId: string
  ): Promise<PollResults> {
    const rows: Array<{ optionIndex: number | string; count: number }> =
      await this.pollVotesRepository.query(
        'SELECT "optionIndex", COUNT(*)::int AS count FROM story_poll_votes WHERE "elementId" = $1 GROUP BY "optionIndex"',
        [elementId]
      );
    const optionCounts = options.map(
      (_, index) => rows.find((row) => Number(row.optionIndex) === index)?.count ?? 0
    );
    const totalVotes = optionCounts.reduce((sum, count) => sum + count, 0);
    const mine = await this.pollVotesRepository.findOne({
      where: { element: { id: elementId }, user: { id: userId } },
    });
    return { optionCounts, totalVotes, myVote: mine ? mine.optionIndex : null };
  }

  /**
   * One vote per (element, user): a single atomic upsert, so a re-vote simply
   * overwrites the previous choice (approved decision #1) and the unique index
   * makes concurrent double-taps race-free.
   */
  async vote(
    storyId: string,
    elementId: string,
    userId: string,
    optionIndex: number
  ): Promise<PollResults> {
    const { options } = await this.findPollElement(storyId, elementId, userId);

    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
      throw new BadRequestException('Invalid poll option.');
    }

    await this.pollVotesRepository.query(
      `INSERT INTO story_poll_votes ("optionIndex", "userId", "elementId")
       VALUES ($1, $2, $3)
       ON CONFLICT ("elementId", "userId")
       DO UPDATE SET "optionIndex" = EXCLUDED."optionIndex", "updatedAt" = now()`,
      [optionIndex, userId, elementId]
    );

    return this.buildResults(elementId, options, userId);
  }

  async getResults(storyId: string, elementId: string, userId: string): Promise<PollResults> {
    const { options } = await this.findPollElement(storyId, elementId, userId);
    return this.buildResults(elementId, options, userId);
  }
}
