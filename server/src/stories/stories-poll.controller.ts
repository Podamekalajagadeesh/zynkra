import { Controller, Post, Get, UseGuards, Request, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoriesPollService } from './stories-poll.service';
import { PollVoteDto } from './dto/poll-vote.dto';

@Controller('stories/:id/elements')
export class StoriesPollController {
  constructor(private readonly storiesPollService: StoriesPollService) {}

  @Post(':elementId/poll-vote')
  @UseGuards(JwtAuthGuard)
  vote(
    @Request() req,
    @Param('id') storyId: string,
    @Param('elementId') elementId: string,
    @Body() dto: PollVoteDto
  ) {
    return this.storiesPollService.vote(storyId, elementId, req.user.userId, dto.optionIndex);
  }

  @Get(':elementId/poll-results')
  @UseGuards(JwtAuthGuard)
  results(@Request() req, @Param('id') storyId: string, @Param('elementId') elementId: string) {
    return this.storiesPollService.getResults(storyId, elementId, req.user.userId);
  }
}
