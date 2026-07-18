import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MobilePushPlatform, MobilePushProvider } from './mobile-push-token.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentUser() user: User) {
    return this.notificationsService.getNotifications(user.id);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read/all')
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post('push/subscribe')
  savePushSubscription(@CurrentUser() user: User, @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.notificationsService.savePushSubscription(user, body);
  }

  @Post('push/mobile')
  saveMobilePushToken(
    @CurrentUser() user: User,
    @Body() body: { token: string; platform?: MobilePushPlatform; provider?: MobilePushProvider },
  ) {
    return this.notificationsService.saveMobilePushToken(user, body.token, body.platform || MobilePushPlatform.ANDROID, body.provider || MobilePushProvider.FCM);
  }
}