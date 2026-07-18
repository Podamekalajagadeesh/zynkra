import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':tag/posts')
  @UseGuards(OptionalJwtAuthGuard)
  getPostsByHashtag(@Param('tag') tag: string, @Request() req) {
    const userId = req.user ? req.user.userId : undefined;
    return this.postsService.findPostsByHashtag(tag, userId);
  }
}