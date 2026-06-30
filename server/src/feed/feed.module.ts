import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { Post } from '../posts/entities/post.entity';
import { PostsModule } from '../posts/posts.module';
import { UserInterestsModule } from '../user-interests/user-interests.module';
import { UsersModule } from '../users/users.module';
import { SponsoredPostsModule } from '../sponsored-posts/sponsored-posts.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { StoriesModule } from '../stories/stories.module';
import { SnapMapModule } from '../snapmap/snapmap.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    forwardRef(() => PostsModule),
    forwardRef(() => UserInterestsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SponsoredPostsModule),
    forwardRef(() => BookmarksModule),
    forwardRef(() => StoriesModule),
    SnapMapModule,
  ],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}