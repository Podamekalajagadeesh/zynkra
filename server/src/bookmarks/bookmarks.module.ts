import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from './entities/bookmark.entity';
import { Post } from '../posts/entities/post.entity';
import { Collection } from './entities/collection.entity';
import { CollectionsController } from './collections.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Post, Collection])],
  controllers: [BookmarksController, CollectionsController],
  providers: [BookmarksService],
  exports: [BookmarksService],
})
export class BookmarksModule {}