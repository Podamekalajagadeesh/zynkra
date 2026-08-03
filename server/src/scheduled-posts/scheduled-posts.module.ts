import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledPostsService } from './scheduled-posts.service';
import { ScheduledPostsController } from './scheduled-posts.controller';
import { ScheduledPost } from './entities/scheduled-post.entity';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledPost]), PostsModule],
  controllers: [ScheduledPostsController],
  providers: [ScheduledPostsService],
  exports: [ScheduledPostsService],
})
export class ScheduledPostsModule {}
