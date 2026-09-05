import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { MobilePushToken, MobilePushPlatform, MobilePushProvider } from './mobile-push-token.entity';
import { ConfigService } from '@nestjs/config';
import webPush from 'web-push';
import axios from 'axios';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(PushSubscriptionEntity)
    private readonly pushSubscriptionRepository: Repository<PushSubscriptionEntity>,
    @InjectRepository(MobilePushToken)
    private readonly mobilePushTokenRepository: Repository<MobilePushToken>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly configService: ConfigService,
    private readonly emailService?: EmailService,
  ) {
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY', 'BKEjbr36R5cSGwT5Af7cgPUPXuaoBGC2KFjAZmehBh9h6ToZ1Cnb9gyptSsVyLb71Qg4_rHVF1J_4L6Okgrialo');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY', 'DTsKcnW0AEmDxuZ5ZN_4gPNI8rgSjPrq-gbet8vL2Pg');
    const vapidSubject = this.configService.get<string>('VAPID_SUBJECT', 'mailto:hello@zynkra.app');

    if (vapidPublicKey && vapidPrivateKey) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }
  }

  async create(user: User, type: NotificationType, data: any): Promise<Notification | null> {
    if (!this.isNotificationEnabledForType(user, type)) {
      this.logger.debug(`Skipping ${type} notification for user ${user.id} because the preference is disabled`);
      return null;
    }

    const notification = this.notificationRepository.create({
      user,
      type,
      data,
    });
    const savedNotification = await this.notificationRepository.save(notification);

    this.notificationsGateway.sendNotificationToUser(user.id, savedNotification);
    await this.sendBrowserPush(user, savedNotification);
    await this.sendMobilePush(user, savedNotification);
    await this.sendEmailNotification(user, savedNotification);

    return savedNotification;
  }

  // Alias for backward compatibility
  async createNotification(
    userOrPayload: User | { userId: string; title: string; message: string; type: string; metadata?: any },
    type?: NotificationType,
    data?: any,
  ): Promise<Notification | null> {
    if (typeof userOrPayload === 'object' && 'userId' in userOrPayload) {
      const payload = userOrPayload;
      const user = { id: payload.userId } as User;
      const notificationType = (payload.type as NotificationType) || NotificationType.LOGIN_ALERT;
      const payloadData = {
        title: payload.title,
        message: payload.message,
        ...payload.metadata,
      };
      return this.create(user, notificationType, payloadData);
    }

    if (!type) {
      throw new Error('Notification type required');
    }

    return this.create(userOrPayload as User, type, data ?? {});
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { user: { id: userId }, read: false },
    });

    return { count };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId, user: { id: userId } } });
    if (notification) {
      notification.read = true;
      return this.notificationRepository.save(notification);
    }
    return null;
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    await this.notificationRepository.update(
      { user: { id: userId }, read: false },
      { read: true },
    );

    return { success: true };
  }

  async savePushSubscription(user: User, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    const existing = await this.pushSubscriptionRepository.findOne({ where: { endpoint: subscription.endpoint } });

    if (existing) {
      existing.keys = subscription.keys;
      existing.user = user;
      return this.pushSubscriptionRepository.save(existing);
    }

    const entity = this.pushSubscriptionRepository.create({
      user,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });

    return this.pushSubscriptionRepository.save(entity);
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<{ success: boolean }> {
    await this.pushSubscriptionRepository.delete({ endpoint, user: { id: userId } });
    return { success: true };
  }

  async saveMobilePushToken(
    user: User,
    token: string,
    platform: MobilePushPlatform,
    provider: MobilePushProvider,
  ) {
    const existing = await this.mobilePushTokenRepository.findOne({ where: { token, user: { id: user.id } } });

    if (existing) {
      existing.platform = platform;
      existing.provider = provider;
      existing.active = true;
      return this.mobilePushTokenRepository.save(existing);
    }

    const entity = this.mobilePushTokenRepository.create({
      user,
      token,
      platform,
      provider,
      active: true,
    });

    return this.mobilePushTokenRepository.save(entity);
  }

  private async sendEmailNotification(user: User, notification: Notification) {
    if (!this.emailService || !user?.email) {
      return;
    }

    const settings = (user as User & { notificationSettings?: Record<string, boolean> }).notificationSettings ?? {};
    const notificationSettings = settings as Record<string, boolean>;
    const globalEmailEnabled = notificationSettings.emailNotifications !== false;
    const typeSpecificEnabled = this.isEmailEnabledForType(user, notification.type);

    if (!globalEmailEnabled || !typeSpecificEnabled) {
      return;
    }

    const subject = this.buildEmailSubject(notification.type);
    const content = notification.data?.message || 'You have a new activity on Zynkra';
    const html = `<p>You have a new notification on Zynkra.</p><p>${content}</p><p><a href="${this.configService.get<string>('CLIENT_URL', 'http://localhost:5173')}/notifications">Open notifications</a></p>`;

    try {
      await this.emailService.sendNotificationEmail(user.email, subject, html, content);
      this.logger.log(`Email notification sent to ${user.email} for ${notification.type}`);
    } catch (error) {
      this.logger.warn(`Failed to send email notification to ${user.email}`, error as Error);
    }
  }

  private isNotificationEnabledForType(user: User, type: NotificationType): boolean {
    const settings = (user as User & { notificationSettings?: Record<string, boolean> }).notificationSettings ?? {};
    const notificationSettings = settings as Record<string, boolean>;

    const customNotifications = (settings as Record<string, unknown>).customNotifications;
    if (customNotifications && typeof customNotifications === 'object' &&
      (customNotifications as Record<string, unknown>)[type] === false) {
      return false;
    }

    switch (type) {
      case NotificationType.LIKE:
        return notificationSettings.likes !== false;
      case NotificationType.COMMENT:
      case NotificationType.REPLY:
        return notificationSettings.comments !== false;
      case NotificationType.MENTION:
        return notificationSettings.notifyMentions !== false;
      case NotificationType.FOLLOW:
        return notificationSettings.newFollowers !== false;
      case 'dm_received' as NotificationType:
      case 'message' as NotificationType:
        return notificationSettings.messages !== false;
      case NotificationType.LOGIN_ALERT:
        return notificationSettings.securityAlerts !== false;
      default:
        return true;
    }
  }

  private isEmailEnabledForType(user: User, type: NotificationType): boolean {
    const settings = (user as User & { notificationSettings?: Record<string, boolean> }).notificationSettings ?? {};
    const notificationSettings = settings as Record<string, boolean>;
    if (notificationSettings.emailNotifications === false) {
      return false;
    }

    return this.isNotificationEnabledForType(user, type);
  }

  private buildEmailSubject(type: NotificationType): string {
    switch (type) {
      case NotificationType.FOLLOW:
        return 'You have a new follower on Zynkra';
      case NotificationType.LIKE:
        return 'Someone liked your post on Zynkra';
      case NotificationType.COMMENT:
      case NotificationType.REPLY:
        return 'Someone replied to your post on Zynkra';
      case NotificationType.MENTION:
        return 'You were mentioned on Zynkra';
      default:
        return 'You have a new notification on Zynkra';
    }
  }

  async sendBrowserPush(user: User, notification: Notification) {
    if (user.notificationSettings?.pushAlerts === false) {
      return;
    }

    const subscriptions = await this.pushSubscriptionRepository.find({ where: { user: { id: user.id } } });

    if (!subscriptions.length) {
      return;
    }

    const payload = {
      title: 'New notification on Zynkra',
      body: notification.data?.message || 'You have a new activity',
      data: {
        notificationId: notification.id,
        url: '/notifications',
      },
    };

    await Promise.allSettled(
      subscriptions.map((subscription) =>
        webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          } as any,
          JSON.stringify(payload),
        ),
      ),
    );
  }

  async sendMobilePush(user: User, notification: Notification) {
    if (user.notificationSettings?.pushAlerts === false) {
      return;
    }

    const tokens = await this.mobilePushTokenRepository.find({ where: { user: { id: user.id }, active: true } });

    if (!tokens.length) {
      return;
    }

    const payload = {
      to: undefined as any,
      notification: {
        title: 'New notification on Zynkra',
        body: notification.data?.message || 'You have a new activity',
      },
      data: {
        notificationId: notification.id,
        url: '/notifications',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY');
    const apnsTopic = this.configService.get<string>('APNS_TOPIC', 'app.zynkra');

    await Promise.allSettled(
      tokens.map(async (tokenEntry) => {
        if (tokenEntry.provider === MobilePushProvider.FCM && fcmServerKey) {
          await axios.post(
            'https://fcm.googleapis.com/fcm/send',
            {
              ...payload,
              to: tokenEntry.token,
            },
            {
              headers: {
                Authorization: `key=${fcmServerKey}`,
                'Content-Type': 'application/json',
              },
            },
          );
          return;
        }

        if (tokenEntry.provider === MobilePushProvider.APNS) {
          await axios.post(
            `https://api.push.apple.com/3/device/${encodeURIComponent(tokenEntry.token)}`,
            {
              aps: {
                alert: {
                  title: 'New notification on Zynkra',
                  body: notification.data?.message || 'You have a new activity',
                },
                sound: 'default',
              },
              data: {
                notificationId: notification.id,
                url: '/notifications',
              },
            },
            {
              headers: {
                'apns-topic': apnsTopic,
                'apns-priority': '10',
                'Content-Type': 'application/json',
              },
            },
          );
        }
      }),
    );
  }
}