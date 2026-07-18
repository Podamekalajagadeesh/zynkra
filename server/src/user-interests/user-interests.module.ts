import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInterestsService } from './user-interests.service';
import { UserInterestsController } from './user-interests.controller';
import { UserInterest } from './user-interest.entity';
import { Tag } from '../tags/tag.entity';
import { Post } from '../posts/entities/post.entity';
import { Product } from '../marketplace/entities/product.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInterest, Tag, Post, Product]),
    AuthModule,
  ],
  controllers: [UserInterestsController],
  providers: [UserInterestsService],
  exports: [UserInterestsService],
})
export class UserInterestsModule {}