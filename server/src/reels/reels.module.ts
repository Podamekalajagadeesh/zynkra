import { Module } from '@nestjs/common';
import { ReelsController } from './reels.controller';
import { ReelsService } from './reels.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReelEffect } from './entities/reel-effect.entity';
import { Post } from '../posts/entities/post.entity';
import { Media } from '../media/entities/media.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ReelEffect, Post, Media])],
  controllers: [ReelsController],
  providers: [ReelsService],
})
export class ReelsModule {}