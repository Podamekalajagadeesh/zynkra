import { Body, Controller, Get, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /** Bulk presence lookup: /activity/status?ids=a,b,c (privacy-respecting). */
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatuses(@Query('ids') ids: string) {
    const userIds = (ids ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 100);
    return this.activityService.getUsersStatuses(userIds);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSettings(@Request() req) {
    return this.activityService.getActivitySettings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  async updateSettings(
    @Request() req,
    @Body() body: { showOnlineStatus?: boolean; showLastSeenTimestamp?: boolean },
  ) {
    return this.activityService.updateActivitySettings(req.user.userId, body);
  }
}
