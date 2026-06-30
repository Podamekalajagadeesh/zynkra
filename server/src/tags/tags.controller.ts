import { Controller, Get, Param } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Post } from '../posts/entities/post.entity';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get(':name/posts')
  async getPostsByTag(@Param('name') name: string): Promise<Post[]> {
    return this.tagsService.findPostsByTagName(name);
  }
}