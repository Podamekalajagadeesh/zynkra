import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Public (auth-required) read of one user's highlights for profile pages.
 * Lives under /users so it can't collide with the /stories/highlights CRUD.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserHighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get(':username/highlights')
  findForUser(@Param('username') username: string, @Request() req) {
    return this.highlightsService.findForUser(username, req.user.userId);
  }
}
