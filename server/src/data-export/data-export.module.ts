import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataExport } from './entities/data-export.entity';
import { DataExportService } from './data-export.service';
import { DataExportController } from './data-export.controller';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Message } from '../dms/entities/message.entity';
import { Conversation } from '../dms/entities/conversation.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostReaction } from '../posts/entities/post-reaction.entity';
import { Follow } from '../users/entities/follow.entity';
import { Bookmark } from '../bookmarks/entities/bookmark.entity';
import { Story } from '../stories/entities/story.entity';
import { GroupMember } from '../groups/entities/group-member.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Order } from '../marketplace/entities/order.entity';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';
import { Article } from '../articles/article.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { Course, CourseEnrollment } from '../courses/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DataExport,
      User,
      Post,
      Message,
      Conversation,
      Comment,
      PostReaction,
      Follow,
      Bookmark,
      Story,
      GroupMember,
      Notification,
      Order,
      LedgerEntry,
      Article,
      Podcast,
      Course,
      CourseEnrollment,
    ]),
  ],
  providers: [DataExportService, ExportService],
  controllers: [DataExportController, ExportController],
  exports: [DataExportService, ExportService],
})
export class DataExportModule {}