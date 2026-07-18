import { Controller, Post, UseGuards, Request, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoriesReactionService } from './stories-reaction.service';

@Controller('stories/:id/react')
export class StoriesReactionController {
  constructor(private readonly storiesReactionService: StoriesReactionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  addReaction(
    @Request() req,
    @Param('id') storyId: string,
    @Body('reaction') reaction: string,
  ) {
    return this.storiesReactionService.addReaction(req.user.id, storyId, reaction);
  }
}