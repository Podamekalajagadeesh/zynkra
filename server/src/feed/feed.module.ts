import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { SmartFeedService } from './smart-feed.service';
import { SmartFeedController } from './smart-feed.controller';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { PostsModule } from '../posts/posts.module';
import { UserInterestsModule } from '../user-interests/user-interests.module';
import { UsersModule } from '../users/users.module';
import { SponsoredPostsModule } from '../sponsored-posts/sponsored-posts.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { StoriesModule } from '../stories/stories.module';
import { SnapMapModule } from '../snapmap/snapmap.module';
import { TrendsModule } from '../trends/trends.module';
import { TranslationModule } from '../translation/translation.module';
import { DataPermissionsModule } from '../common/data-permissions/data-permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User]),
    forwardRef(() => PostsModule),
    forwardRef(() => UserInterestsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SponsoredPostsModule),
    forwardRef(() => BookmarksModule),
    forwardRef(() => StoriesModule),
    SnapMapModule,
    TrendsModule,
    TranslationModule,
    DataPermissionsModule,
  ],
  providers: [FeedService, SmartFeedService],
  controllers: [FeedController, SmartFeedController],
  exports: [FeedService, SmartFeedService],
})
export class FeedModule {}