import { Controller, Post, UseGuards, Request, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoriesReplyService } from './stories-reply.service';
import { StoryReplyDto } from './dto/story-reply.dto';

@Controller('stories/:id/reply')
export class StoriesReplyController {
  constructor(private readonly storiesReplyService: StoriesReplyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  addReply(@Request() req, @Param('id') storyId: string, @Body() dto: StoryReplyDto) {
    return this.storiesReplyService.addReply(req.user.id, storyId, dto.text);
  }
}
