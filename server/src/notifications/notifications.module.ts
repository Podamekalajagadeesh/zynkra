import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { MobilePushToken } from './mobile-push-token.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, PushSubscriptionEntity, MobilePushToken]), forwardRef(() => AuthModule), forwardRef(() => UsersModule), EmailModule],
  providers: [NotificationsGateway, NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}