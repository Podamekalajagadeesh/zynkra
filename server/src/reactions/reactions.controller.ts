import { Controller, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReactionsService } from './reactions.service';

@Controller('posts/:id/react')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  addReaction(
    @Request() req,
    @Param('id') postId: string,
    @Body('reaction') reaction: string,
  ) {
    return this.reactionsService.addReaction(req.user.id, postId, reaction);
  }
}