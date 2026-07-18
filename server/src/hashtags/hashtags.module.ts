import { Module } from '@nestjs/common';
import { HashtagsController } from './hashtags.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule],
  controllers: [HashtagsController],
})
export class HashtagsModule {}