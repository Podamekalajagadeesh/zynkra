import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SponsoredPost } from './entities/sponsored-post.entity';
import { SponsoredPostsService } from './sponsored-posts.service';
import { SponsoredPostsController } from './sponsored-posts.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([SponsoredPost]), PostsModule],
  providers: [SponsoredPostsService],
  controllers: [SponsoredPostsController],
  exports: [SponsoredPostsService],
})
export class SponsoredPostsModule {}