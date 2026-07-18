import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BerealService } from './bereal.service';
import { BerealController } from './bereal.controller';
import { BerealPost } from './entities/bereal.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BerealPost, User, Post]),
    NotificationsModule,
  ],
  controllers: [BerealController],
  providers: [BerealService],
  exports: [BerealService],
})
export class BerealModule {}