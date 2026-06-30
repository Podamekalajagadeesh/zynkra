import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { TimelineReviewService } from './timeline-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('timeline-review')
@UseGuards(JwtAuthGuard)
export class TimelineReviewController {
  constructor(private readonly timelineReviewService: TimelineReviewService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.timelineReviewService.findAll(user.userId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timelineReviewService.approve(id, user.userId);
  }

  @Post(':id/hide')
  hide(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timelineReviewService.hide(id, user.userId);
  }
}