import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { FollowRequest } from './entities/follow-request.entity';
import { Follow } from './entities/follow.entity';
import { LifeEvent } from './entities/life-event.entity';
import { Poke } from './entities/poke.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PagesModule } from '../pages/pages.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AccountManagementService } from '../features/account-management/account-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, FollowRequest, Follow, LifeEvent, Poke]),
    StorageModule,
    forwardRef(() => NotificationsModule),
    PagesModule,
    WebhooksModule,
  ],
  providers: [UsersService, AccountManagementService],
  exports: [UsersService, TypeOrmModule],
  controllers: [UsersController],
})
export class UsersModule {}