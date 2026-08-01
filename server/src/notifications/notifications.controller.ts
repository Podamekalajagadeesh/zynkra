import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MobilePushPlatform, MobilePushProvider } from './mobile-push-token.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { AiNotificationsService } from './ai-notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly aiNotificationsService: AiNotificationsService,
  ) {}

  @Get()
  getNotifications(@Req() req: Request) {
    return this.notificationsService.getNotifications(this.getUserId(req));
  }

  @Get('ai/digest')
  async getAiDigest(@Req() req: Request) {
    const notifications = await this.notificationsService.getNotifications(this.getUserId(req));
    return this.aiNotificationsService.generateDigest(notifications as any);
  }

  @Get('ai/prioritized')
  async getAiPrioritized(@Req() req: Request) {
    const notifications = await this.notificationsService.getNotifications(this.getUserId(req));
    return this.aiNotificationsService.filterNotifications(notifications as any);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    return this.notificationsService.getUnreadCount(this.getUserId(req));
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.markAsRead(id, this.getUserId(req));
  }

  @Patch('read/all')
  markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead(this.getUserId(req));
  }

  @Post('push/subscribe')
  savePushSubscription(
    @Req() req: Request,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.notificationsService.savePushSubscription(this.getUserEntity(req), body);
  }

  @Post('push/mobile')
  saveMobilePushToken(
    @Req() req: Request,
    @Body() body: { token: string; platform?: MobilePushPlatform; provider?: MobilePushProvider },
  ) {
    return this.notificationsService.saveMobilePushToken(
      this.getUserEntity(req),
      body.token,
      body.platform || MobilePushPlatform.ANDROID,
      body.provider || MobilePushProvider.FCM,
    );
  }

  // The JWT strategy exposes userId (with id present on some auth paths) — read both.
  private getUserId(req: Request): string {
    const user = req.user as { userId?: string; id?: string } | undefined;
    return user?.userId || user?.id || '';
  }

  // A minimal user reference so relation columns resolve to the authenticated user.
  private getUserEntity(req: Request): User {
    return { id: this.getUserId(req) } as User;
  }
}
