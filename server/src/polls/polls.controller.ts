import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post(':pollOptionId/vote')
  @UseGuards(JwtAuthGuard)
  vote(@Param('pollOptionId') pollOptionId: string, @Request() req) {
    return this.pollsService.vote(pollOptionId, req.user.userId);
  }
}