import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Tag } from '../tags/tag.entity';
import { Place } from '../places/entities/place.entity';
import { Event } from '../events/entities/event.entity';
import { Group } from '../groups/entities/group.entity';
import { Product } from '../marketplace/entities/product.entity';
import { TagsModule } from '../tags/tags.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Tag, Place, Group, Event, Product]),
    TagsModule,
    PlacesModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}