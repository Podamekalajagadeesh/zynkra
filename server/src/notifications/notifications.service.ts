import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(user: User, type: NotificationType, data: any): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user,
      type,
      data,
    });
    const savedNotification = await this.notificationRepository.save(notification);

    this.notificationsGateway.sendNotificationToUser(user.id, savedNotification);

    return savedNotification;
  }

  // Alias for backward compatibility
  async createNotification(user: User, type: NotificationType, data: any): Promise<Notification> {
    return this.create(user, type, data);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId, user: { id: userId } } });
    if (notification) {
      notification.read = true;
      return this.notificationRepository.save(notification);
    }
    return null;
  }
}