import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TimelineService } from './timeline.service';

@Controller('timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('review')
  getPendingReview(@CurrentUser() user: User) {
    return this.timelineService.getPendingReview(user.id);
  }

  @Post('review/:id/approve')
  approvePost(@Param('id') id: string) {
    return this.timelineService.approvePost(id);
  }

  @Post('review/:id/hide')
  hidePost(@Param('id') id: string) {
    return this.timelineService.hidePost(id);
  }
}