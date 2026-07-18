import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryHighlight } from './entities/story-highlight.entity';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { User } from '../users/entities/user.entity';
import { StoriesService } from './stories.service';

@Injectable()
export class HighlightsService {
  constructor(
    @InjectRepository(StoryHighlight)
    private highlightsRepository: Repository<StoryHighlight>,
    private readonly storiesService: StoriesService,
  ) {}

  async create(createHighlightDto: CreateHighlightDto, user: User): Promise<StoryHighlight> {
    const stories = await this.storiesService.findMultipleByIds(createHighlightDto.storyIds, user.id);
    if (stories.length !== createHighlightDto.storyIds.length) {
      throw new NotFoundException('One or more stories not found or do not belong to the user.');
    }

    const highlight = this.highlightsRepository.create({
      title: createHighlightDto.title,
      coverUrl: createHighlightDto.coverUrl,
      user,
      stories,
    });

    return this.highlightsRepository.save(highlight);
  }

  async findAll(userId: string): Promise<StoryHighlight[]> {
    return this.highlightsRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(id: string): Promise<StoryHighlight> {
    const highlight = await this.highlightsRepository.findOne({ where: { id } });
    if (!highlight) {
      throw new NotFoundException(`Highlight with ID "${id}" not found`);
    }
    return highlight;
  }

  async update(id: string, updateHighlightDto: UpdateHighlightDto, user: User): Promise<StoryHighlight> {
    const highlight = await this.findOne(id);
    if (highlight.user.id !== user.id) {
      throw new UnauthorizedException();
    }

    if (updateHighlightDto.storyIds) {
      const stories = await this.storiesService.findMultipleByIds(updateHighlightDto.storyIds, user.id);
      if (stories.length !== updateHighlightDto.storyIds.length) {
        throw new NotFoundException('One or more stories not found or do not belong to the user.');
      }
      highlight.stories = stories;
    }

    Object.assign(highlight, updateHighlightDto);
    return this.highlightsRepository.save(highlight);
  }

  async remove(id: string, user: User): Promise<void> {
    const highlight = await this.findOne(id);
    if (highlight.user.id !== user.id) {
      throw new UnauthorizedException();
    }
    await this.highlightsRepository.remove(highlight);
  }
}