
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LiveStreamReplayService } from './livestream-replay.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { User } from '../../src/users/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('livestream-replays')
export class LiveStreamReplayController {
  constructor(
    private readonly replayService: LiveStreamReplayService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      videoUrl: string;
      title: string;
    },
  ) {
    return this.replayService.create(req.user, body.videoUrl, body.title);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.replayService.findByUserId(userId);
  }

  @Patch(':replayId/publish')
  async publish(@Param('replayId') replayId: string) {
    return this.replayService.publish(replayId);
  }
}