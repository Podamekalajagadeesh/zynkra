import { Controller, Get, Post, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { MentionsService } from './mentions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mentions')
@UseGuards(JwtAuthGuard)
export class MentionsController {
  constructor(private readonly mentionsService: MentionsService) {}

  @Get()
  async getMyMentions(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.mentionsService.getUserMentions(user, page, limit);
  }

  @Get('unread/count')
  async getUnreadMentionsCount(@CurrentUser() user: User) {
    return this.mentionsService.getUnreadCount(user);
  }

  @Post(':id/mark-read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.mentionsService.markAsRead(id, user);
  }

  @Post('mark-all-read')
  async markAllAsRead(@CurrentUser() user: User) {
    return this.mentionsService.markAllAsRead(user);
  }

  @Delete(':id')
  async deleteMention(@Param('id') id: string, @CurrentUser() user: User) {
    return this.mentionsService.deleteMention(id, user);
  }
}