import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionsService: SessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSessions(@Request() req) {
    return this.sessionsService.getUserSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/revoke')
  async revokeSession(@Request() req, @Param('id') id: string) {
    return this.sessionsService.revokeSession(req.user.id, id);
  }
}