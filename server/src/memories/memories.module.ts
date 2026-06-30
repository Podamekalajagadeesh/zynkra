
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemoriesService } from './memories.service';
import { MemoriesController } from './memories.controller';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  providers: [MemoriesService],
  controllers: [MemoriesController],
})
export class MemoriesModule {}